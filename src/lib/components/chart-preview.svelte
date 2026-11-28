<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { onMount, untrack } from "svelte";
  import { claimPlayback, releasePlayback } from "$lib/state/now-playing.js";
  import { cn } from "$lib/utils.js";
  import Sheet from "./sheet.svelte";
  import { SONOLUS_SERVER_URL } from "$lib/config.js";
  import { createPreviewRenderer, type PreviewRenderer } from "$lib/chart-preview/preview/gl";
  import { renderPreviewFrame } from "$lib/chart-preview/preview/engine/render";
  import { buildPreviewChart } from "$lib/chart-preview/preview/engine/chart";
  import { NoteKind } from "$lib/chart-preview/preview/engine/model";
  import { TARGET_ASPECT_RATIO } from "$lib/chart-preview/preview/engine/layout";
  import { loadSkinFromServer, type LoadedSkin } from "$lib/chart-preview/preview/skin";
  import { loadParticleFromServer, type LoadedParticle } from "$lib/chart-preview/preview/particle";
  import { loadPreviewState, pickItemName } from "$lib/chart-preview/load";
  import { loadEffectFromServer, createSfxPlayer, hitSounds, type SfxPlayer } from "$lib/chart-preview/preview/sfx";
  import type { State } from "$lib/chart-preview/state";
  import {
    RiPlayFill,
    RiPauseFill,
    RiRestartLine,
    RiVolumeUpLine,
    RiVolumeMuteLine,
    RiFullscreenLine,
    RiFullscreenExitLine,
    RiSubtractLine,
    RiAddLine,
    RiErrorWarningLine,
    RiSettings3Line,
  } from "$lib/icons.js";

  // the server lists a novelty particle pack first; use the standard ones when they're there
  const PARTICLES = ["toasted-bread-st", "toasted-bread-lw"];
  const EFFECTS = ["coconut-next-sekai-1"];

  let {
    chartUrl,
    audioUrl,
    bgUrl = null,
    server = SONOLUS_SERVER_URL,
    time = $bindable(0),
  }: { chartUrl: string; audioUrl: string; bgUrl?: string | null; server?: string; time?: number } = $props();

  let stage = $state<HTMLDivElement>();
  let container = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let audio = $state<HTMLAudioElement>();
  let renderer: PreviewRenderer | undefined;

  let skin = $state<LoadedSkin>();
  let particle = $state<LoadedParticle>();
  let sfx = $state<SfxPlayer>();
  let chartState = $state<State>();
  // nothing is downloaded until the first press of play: skin, particles, sounds and chart are heavy
  let status = $state<"idle" | "loading" | "error" | "ready">("idle");
  let step = $state("preview.loadingSkin");

  let playing = $state(false);
  let cursorTime = $state(0);
  let audioDuration = $state(0);
  let isFullscreen = $state(false);
  // fallback "fullscreen" for browsers that can't fullscreen a div (iPhone Safari)
  let pseudoFullscreen = $state(false);
  let portrait = $state(false);
  const fullscreen = $derived(isFullscreen || pseudoFullscreen);
  // a phone-sized inline player is too short for the settings panel, so it opens as a bottom sheet instead
  let stageHeight = $state(0);
  const settingsInSheet = $derived(!fullscreen && stageHeight > 0 && stageHeight < 320);
  let settingsOpen = $state(false);
  let playWhenReady = $state(false);
  // until the first play, the player shows nothing but its play icon
  let started = $state(false);

  const DEFAULTS = {
    noteSpeed: 11,
    quality: 1,
    showEffects: true,
    musicVolume: 0.8,
    sfxVolume: 0.7,
  };
  let noteSpeed = $state(DEFAULTS.noteSpeed);
  let quality = $state(DEFAULTS.quality);
  let showEffects = $state(DEFAULTS.showEffects);
  let muted = $state(false);
  let musicVolume = $state(DEFAULTS.musicVolume);
  let sfxVolume = $state(DEFAULTS.sfxVolume);
  let volumeOpen = $state(false);
  let settingsLoaded = false;

  const QUALITY = [
    { get label() { return t("preview.qualityLow"); }, value: 0.5 },
    { get label() { return t("preview.qualityMed"); }, value: 0.75 },
    { get label() { return t("preview.qualityHigh"); }, value: 1 },
    { get label() { return t("preview.qualityMax"); }, value: 1.5 },
  ];

  const offset = $derived(chartState?.bgm.offset ?? 0);
  const previewChart = $derived(chartState ? buildPreviewChart(chartState, noteSpeed) : undefined);
  const chartDuration = $derived(
    previewChart ? previewChart.notes.reduce((m, n) => Math.max(m, n.targetTime), 0) + 2 : 0,
  );
  const duration = $derived(audioDuration > 0 ? audioDuration - offset : chartDuration);

  // combo: how many judged notes the playhead has passed. Hidden slide ticks count (they're judged,
  // and a full combo's judgement total includes them); fakes, anchors and damage notes don't.
  const UNJUDGED: number[] = [NoteKind.anchor, NoteKind.damage];
  const comboTimes = $derived(
    previewChart
      ? previewChart.notes
          .filter((n) => !n.isFake && !UNJUDGED.includes(n.kind))
          .map((n) => n.targetTime)
          .sort((a, b) => a - b)
      : [],
  );
  const combo = $derived.by(() => {
    let lo = 0;
    let hi = comboTimes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (comboTimes[mid] <= cursorTime) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  });

  let cw = $state(0),
    ch = $state(0),
    cl = $state(0),
    ct = $state(0);
  let containerW = 0,
    containerH = 0;
  let dirty = $state(true);

  function updateCanvasSize() {
    if (!containerW || !containerH) return;
    const width = Math.min(containerW, containerH * TARGET_ASPECT_RATIO);
    const height = width / TARGET_ASPECT_RATIO;
    const pr = Math.min(2, devicePixelRatio || 1);
    cw = Math.round(width * pr) / pr;
    ch = Math.round(height * pr) / pr;
    cl = Math.round(((containerW - cw) / 2) * pr) / pr;
    ct = Math.round(((containerH - ch) / 2) * pr) / pr;
    dirty = true;
  }

  function getRenderSize(scale: number) {
    if (!renderer) return;
    const rw = cw * scale,
      rh = ch * scale;
    const { width: mw, height: mh } = renderer.maxViewportSize;
    const fit = Math.min(1, mw / rw, mh / rh);
    return { width: Math.max(1, Math.round(rw * fit)), height: Math.max(1, Math.round(rh * fit)) };
  }

  $effect(() => {
    noteSpeed;
    quality;
    showEffects;
    skin;
    particle;
    dirty = true;
  });

  $effect(() => {
    if (audio) {
      audio.volume = musicVolume;
      audio.muted = muted;
    }
    sfx?.setVolume(muted ? 0 : sfxVolume);
  });

  // hit sounds follow the chart (and the note speed, which rebuilds it)
  $effect(() => {
    if (sfx && previewChart) sfx.setSounds(hitSounds(previewChart), untrack(() => cursorTime));
  });

  // the page underneath shouldn't scroll while the fallback fullscreen covers it
  $effect(() => {
    if (!pseudoFullscreen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  });

  $effect(() => {
    const snapshot = { noteSpeed, quality, showEffects, musicVolume, sfxVolume };
    if (!settingsLoaded) return;
    try {
      localStorage.setItem("unch:preview-settings-v2", JSON.stringify(snapshot));
    } catch {
      void 0;
    }
  });

  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (audio && playing) {
      cursorTime = audio.currentTime - offset;
      time = cursorTime;
      sfx?.update(cursorTime);
    }
    if (!renderer || !skin || !previewChart || !cw || !ch) return;
    if (!playing && !dirty) return;
    const rs = getRenderSize(Math.min(2, devicePixelRatio || 1) * quality);
    if (!rs) return;
    renderPreviewFrame(
      renderer,
      skin.skin,
      previewChart,
      cursorTime,
      rs.width,
      rs.height,
      cw,
      ch,
      noteSpeed,
      showEffects,
      particle?.particle,
    );
    dirty = false;
  }

  async function init() {
    status = "loading";
    try {
      step = "preview.loadingSkin";
      const [skinName, particleName, effectName] = await Promise.all([
        pickItemName(server, "skins"),
        pickItemName(server, "particles", PARTICLES),
        pickItemName(server, "effects", EFFECTS),
      ]);
      if (skinName) skin = await loadSkinFromServer(server, skinName);
      if (particleName)
        particle = await loadParticleFromServer(server, particleName).catch(() => undefined);
      // sounds are optional; the preview still works silently if they fail
      if (effectName && !sfx)
        loadEffectFromServer(server, effectName)
          .then((effect) => (sfx = createSfxPlayer(effect)))
          .catch((e) => console.warn("Preview sounds unavailable:", e));
      step = "preview.loadingChart";
      chartState = await loadPreviewState(chartUrl);
      status = skin ? "ready" : "error";
      if (status === "ready" && playWhenReady) void audio?.play();
    } catch (e) {
      console.error("Chart preview failed:", e);
      status = "error";
    }
  }

  $effect(() => {
    if (!canvas || !skin) return;
    if (!renderer || renderer.isContextLost()) {
      try {
        renderer = createPreviewRenderer(canvas, true);
      } catch (e) {
        console.error("Renderer init failed:", e);
        status = "error";
        return;
      }
    }
    renderer.setTexture(0, skin.texture, skin.interpolation);
    if (particle) renderer.setTexture(1, particle.texture, particle.interpolation);
    dirty = true;
  });

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("unch:preview-settings-v2") ?? "null");
      if (saved) {
        noteSpeed = saved.noteSpeed ?? noteSpeed;
        quality = saved.quality ?? quality;
        showEffects = saved.showEffects ?? showEffects;
        musicVolume = saved.musicVolume ?? musicVolume;
        sfxVolume = saved.sfxVolume ?? sfxVolume;
      }
    } catch {
      void 0;
    }
    settingsLoaded = true;

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      containerW = entry.contentRect.width;
      containerH = entry.contentRect.height;
      updateCanvasSize();
    });
    if (container) ro.observe(container);

    const onFs = () => {
      isFullscreen = document.fullscreenElement === stage;
      if (!isFullscreen) orientation()?.unlock?.();
    };
    document.addEventListener("fullscreenchange", onFs);

    const portraitQuery = matchMedia("(orientation: portrait)");
    const onOrientation = () => (portrait = portraitQuery.matches);
    onOrientation();
    portraitQuery.addEventListener("change", onOrientation);

    raf = requestAnimationFrame(frame);
    return () => {
      ro.disconnect();
      document.removeEventListener("fullscreenchange", onFs);
      portraitQuery.removeEventListener("change", onOrientation);
      cancelAnimationFrame(raf);
      renderer?.dispose();
      sfx?.dispose();
      releasePlayback(player);
    };
  });

  // the preview takes over from any song bar or card that was playing, and vice versa
  const player = { stop: () => audio?.pause() };
  function onPlay() {
    playing = true;
    started = true;
    claimPlayback(player);
    sfx?.resume();
    if (audio) sfx?.reset(audio.currentTime - offset);
  }
  function onPause() {
    playing = false;
    sfx?.reset(cursorTime);
  }
  function toggle() {
    if (!audio || status !== "ready") return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }
  function restart() {
    if (!audio) return;
    audio.currentTime = Math.max(0, offset);
    cursorTime = 0;
    sfx?.reset(0);
    dirty = true;
    void audio.play();
  }
  function seek(e: Event) {
    seekTo(Number.parseFloat((e.target as HTMLInputElement).value));
  }
  // jump to a point in the chart (seconds); also used by the page's density graph
  export function seekTo(t: number) {
    const v = Math.max(0, t);
    cursorTime = v;
    time = v;
    if (audio) audio.currentTime = Math.max(0, v + offset);
    sfx?.reset(v);
    dirty = true;
    if (status === "idle") start();
    else if (status === "ready" && audio?.paused) void audio.play();
  }
  // first press: load everything, then play once it's ready
  function start() {
    playWhenReady = true;
    if (status === "idle" || status === "error") void init();
  }
  function nudgeSpeed(delta: number) {
    noteSpeed = Math.min(12, Math.max(1, Math.round((noteSpeed + delta) * 10) / 10));
  }
  function resetSettings() {
    noteSpeed = DEFAULTS.noteSpeed;
    quality = DEFAULTS.quality;
    showEffects = DEFAULTS.showEffects;
    musicVolume = DEFAULTS.musicVolume;
    sfxVolume = DEFAULTS.sfxVolume;
  }
  type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void };
  const orientation = () => (typeof screen === "undefined" ? undefined : (screen.orientation as LockableOrientation | undefined));

  async function enterFullscreen() {
    if (!stage) return;
    const request =
      stage.requestFullscreen ?? (stage as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
    if (request) {
      try {
        await request.call(stage);
        // phones: play the chart sideways while fullscreen. Android honours this; iOS ignores it.
        await orientation()?.lock?.("landscape").catch(() => {});
        return;
      } catch {
        // fall through to the fallback below
      }
    }
    // iPhone Safari can only fullscreen <video>, so fill the viewport ourselves (rotated if held upright)
    pseudoFullscreen = true;
  }

  function exitFullscreen() {
    if (pseudoFullscreen) {
      pseudoFullscreen = false;
      return;
    }
    orientation()?.unlock?.();
    if (document.fullscreenElement) void document.exitFullscreen();
  }

  function toggleFullscreen() {
    if (isFullscreen || pseudoFullscreen) exitFullscreen();
    else void enterFullscreen();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && settingsOpen) {
      settingsOpen = false;
      return;
    }
    if (e.key === "Escape" && pseudoFullscreen) {
      pseudoFullscreen = false;
      return;
    }
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    }
  }
  function fmt(s: number) {
    const t = Math.max(0, s);
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
</script>

<audio
  bind:this={audio}
  src={audioUrl}
  preload="auto"
  onplay={onPlay}
  onpause={onPause}
  onended={onPause}
  onloadedmetadata={() => (audioDuration = audio?.duration ?? 0)}
></audio>

{#snippet settingsBody()}
  <div class="flex items-center justify-between pb-1">
    <h3 class="text-sm font-semibold">{t("preview.previewSettings")}</h3>
    <button type="button" onclick={resetSettings} class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white">
      <RiRestartLine class="size-3.5" />
      {t("generic.reset")}
    </button>
  </div>

  <div class="space-y-2 border-t border-white/10 pt-3">
    <div class="flex items-baseline justify-between">
      <span class="text-sm">{t("preview.scrollSpeed")}</span>
      <span class="font-heading text-sm font-semibold tabular-nums">{noteSpeed.toFixed(1)}</span>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" onclick={() => nudgeSpeed(-0.1)} aria-label={t("preview.slower")} class="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
        <RiSubtractLine class="size-3.5" />
      </button>
      <input type="range" min="1" max="12" step="0.1" bind:value={noteSpeed} aria-label={t("preview.scrollSpeed")} class="range range-primary range-xs min-w-0 flex-1" />
      <button type="button" onclick={() => nudgeSpeed(0.1)} aria-label={t("preview.faster")} class="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
        <RiAddLine class="size-3.5" />
      </button>
    </div>
  </div>

  <div class="space-y-2 border-t border-white/10 pt-3">
    <span class="text-sm">{t("preview.quality")}</span>
    <div class="grid grid-cols-4 gap-1 rounded-full bg-white/10 p-1" role="radiogroup" aria-label={t("preview.quality")}>
      {#each QUALITY as q (q.value)}
        <button
          type="button"
          role="radio"
          aria-checked={quality === q.value}
          onclick={() => (quality = q.value)}
          class={cn(
            "rounded-full py-1 text-xs font-medium transition-colors",
            quality === q.value ? "bg-white text-slate-900" : "text-white/70 hover:text-white",
          )}
        >
          {q.label}
        </button>
      {/each}
    </div>
  </div>

  <label class="flex cursor-pointer items-center justify-between gap-3 border-t border-white/10 pt-3">
    <span class="text-sm">{t("preview.hitEffects")}</span>
    <input type="checkbox" bind:checked={showEffects} class="toggle toggle-primary toggle-sm" />
  </label>

  <div class="border-t border-white/10 pt-3">
    {@render volumeBody()}
  </div>
{/snippet}

{#snippet volumeBody()}
  <div class="space-y-3">
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between">
        <span class="text-sm">{t("preview.music")}</span>
        <span class="text-xs text-white/60 tabular-nums">{muted ? t("preview.mute") : `${Math.round(musicVolume * 100)}%`}</span>
      </div>
      <input type="range" min="0" max="1" step="0.05" bind:value={musicVolume} aria-label={t("preview.musicVolume")} class="range range-primary range-xs w-full" />
    </div>
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between">
        <span class="text-sm">{t("preview.hitSounds")}</span>
        <span class="text-xs text-white/60 tabular-nums">{muted ? t("preview.mute") : `${Math.round(sfxVolume * 100)}%`}</span>
      </div>
      <input type="range" min="0" max="1" step="0.05" bind:value={sfxVolume} aria-label={t("preview.hitSoundsVolume")} class="range range-primary range-xs w-full" />
    </div>
    <button
      type="button"
      onclick={() => (muted = !muted)}
      aria-pressed={muted}
      class="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white/10 py-1.5 text-xs font-medium hover:bg-white/20"
    >
      {#if muted}<RiVolumeMuteLine class="size-3.5" />{:else}<RiVolumeUpLine class="size-3.5" />{/if}
      {muted ? t("preview.unmute") : t("preview.mute")}
    </button>
  </div>
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={stage}
  bind:clientHeight={stageHeight}
  tabindex="0"
  role="region"
  aria-label={t("preview.chartPreview")}
  onkeydown={onKey}
  class={cn(
    "focus-visible:ring-ring/60 overflow-hidden bg-slate-950 outline-none focus-visible:ring-2",
    fullscreen ? "rounded-none border-0" : "relative aspect-video w-full rounded-3xl border",
    pseudoFullscreen && "fixed z-[100]",
    pseudoFullscreen && !portrait && "inset-0",
  )}
  style={pseudoFullscreen && portrait
    ? "top: 0; left: 100vw; width: 100dvh; height: 100vw; transform: rotate(90deg); transform-origin: top left;"
    : undefined}
>
  {#if bgUrl}
    <div class="absolute inset-0 bg-cover bg-center" style={`background-image:url(${bgUrl})`}></div>
    <div class="absolute inset-0 bg-slate-950/55"></div>
  {/if}

  <div bind:this={container} class="absolute inset-0">
    <div
      class="@container absolute overflow-hidden"
      style={`left:${cl}px;top:${ct}px;width:${cw}px;height:${ch}px`}
    >
      <canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
      {#if combo > 0}
        <div class="pointer-events-none absolute top-[30%] right-[6%] text-center text-white select-none" aria-hidden="true">
          <div class="font-heading text-[clamp(1.5rem,6cqw,3.5rem)] leading-none font-bold tabular-nums">{combo}</div>
          <div class="font-heading mt-1 text-[clamp(0.55rem,1.4cqw,0.8rem)] font-semibold tracking-[0.3em] text-cyan-200/90">COMBO</div>
        </div>
      {/if}
    </div>
  </div>

  {#if started}
    <div class="pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-slate-950/70 to-transparent px-4 pt-3 pb-8">
      <h2 class="text-sm font-semibold text-white">{t("preview.preview")}</h2>
    </div>
  {/if}

  {#if status === "idle" || status === "loading"}
    <!-- the play button is there from the start; pressing it early plays as soon as the chart is ready -->
    <button
      type="button"
      onclick={start}
      aria-label={t("preview.playPreview")}
      class="absolute inset-0 grid place-items-center bg-slate-950/40 text-white"
    >
      <RiPlayFill class={cn("block size-16 drop-shadow-[0_4px_16px_rgb(0_0_0/0.6)]", playWhenReady && "animate-pulse")} />
    </button>
  {:else if status === "error"}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 px-6 text-center text-white">
      <RiErrorWarningLine class="block size-8 text-rose-300" />
      <p class="text-sm">{t("preview.loadFailed")}</p>
      <button
        type="button"
        onclick={init}
        class="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/25"
      >
        {t("generic.tryAgain")}
      </button>
    </div>
  {:else}
    {#if !playing && !(settingsOpen && !settingsInSheet)}
      <button
        type="button"
        onclick={toggle}
        aria-label={t("preview.playPreview")}
        class="group absolute inset-0 grid place-items-center bg-slate-950/20 transition-colors hover:bg-slate-950/35"
      >
        <RiPlayFill class="block size-16 text-white drop-shadow-[0_4px_16px_rgb(0_0_0/0.6)] transition-transform group-hover:scale-110" />
      </button>
    {/if}

    {#if playing && !settingsOpen && !volumeOpen}
      <!-- tapping the picture pauses, the same way tapping it resumes -->
      <button type="button" onclick={toggle} aria-label={t("generic.pause")} class="absolute inset-0 cursor-pointer"></button>
    {/if}

    {#if volumeOpen}
      <button
        type="button"
        aria-label={t("preview.closeSettings")}
        onclick={() => (volumeOpen = false)}
        class="absolute inset-0 cursor-default"
      ></button>
      <div
        role="dialog"
        aria-label={t("preview.volume")}
        class="absolute right-2 bottom-14 z-20 w-60 max-w-[calc(100%-1rem)] rounded-2xl bg-slate-900/95 p-4 text-white shadow-2xl ring-1 ring-white/10"
      >
        {@render volumeBody()}
      </div>
    {/if}

    {#if settingsOpen && !settingsInSheet}
      <button
        type="button"
        aria-label={t("preview.closeSettings")}
        onclick={() => (settingsOpen = false)}
        class="absolute inset-0 cursor-default"
      ></button>
      <div
        role="dialog"
        aria-label={t("preview.previewSettings")}
        class="absolute right-2 bottom-14 z-20 max-h-[calc(100%-4.5rem)] w-72 max-w-[calc(100%-1rem)] space-y-3 overflow-y-auto overscroll-contain rounded-2xl bg-slate-900/95 p-4 text-white shadow-2xl ring-1 ring-white/10"
      >
        {@render settingsBody()}
      </div>
    {/if}

    <div class={cn("absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-linear-to-t from-slate-950/90 to-transparent px-2.5 pt-8 pb-2 text-white sm:gap-2", !started && "hidden")}>
      <button
        type="button"
        onclick={toggle}
        aria-label={playing ? t("generic.pause") : t("generic.play")}
        class="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15"
      >
        {#if playing}
          <RiPauseFill class="block size-5" />
        {:else}
          <RiPlayFill class="block size-5" />
        {/if}
      </button>
      <button
        type="button"
        onclick={restart}
        aria-label={t("preview.restart")}
        class="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15"
      >
        <RiRestartLine class="block size-4.5" />
      </button>
      <span class="shrink-0 text-xs text-white/85 tabular-nums">{fmt(cursorTime)}</span>
      <input
        type="range"
        min="0"
        max={duration || 1}
        step="0.01"
        value={cursorTime}
        oninput={seek}
        aria-label={t("preview.seek")}
        class="range range-primary range-xs mx-1 min-w-0 flex-1"
      />
      <span class="shrink-0 text-xs text-white/60 tabular-nums">{fmt(duration)}</span>
      <button
        type="button"
        onclick={() => {
          volumeOpen = !volumeOpen;
          settingsOpen = false;
        }}
        aria-label={t("preview.volume")}
        aria-expanded={volumeOpen}
        class={cn("grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15", volumeOpen && "bg-white/15")}
      >
        {#if muted}
          <RiVolumeMuteLine class="block size-4.5" />
        {:else}
          <RiVolumeUpLine class="block size-4.5" />
        {/if}
      </button>
      <button
        type="button"
        onclick={() => {
          settingsOpen = !settingsOpen;
          volumeOpen = false;
        }}
        aria-label={t("generic.settings")}
        aria-expanded={settingsOpen}
        class={cn(
          "grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15",
          settingsOpen && "bg-white/15",
        )}
      >
        <RiSettings3Line class={cn("block size-4.5 transition-transform", settingsOpen && "rotate-45")} />
      </button>
      <button
        type="button"
        onclick={toggleFullscreen}
        aria-label={fullscreen ? t("preview.exitFullscreen") : t("preview.fullscreen")}
        class="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15"
      >
        {#if fullscreen}
          <RiFullscreenExitLine class="block size-4.5" />
        {:else}
          <RiFullscreenLine class="block size-4.5" />
        {/if}
      </button>
    </div>
  {/if}
</div>

{#if settingsInSheet}
  <Sheet bind:open={settingsOpen}>
    <div class="m-3 space-y-3 rounded-2xl bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-white">
      {@render settingsBody()}
    </div>
  </Sheet>
{/if}
