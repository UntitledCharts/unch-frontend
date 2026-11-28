<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t, i18n } from "$lib/i18n.svelte.js";
  import { goto, afterNavigate } from "$app/navigation";
  import { tick, onMount } from "svelte";
  import { DEFAULT_LIMITS, fetchLimits, checkLimits } from "$lib/data/limits.js";
  import Button from "$lib/components/button.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import FileSlot from "$lib/components/file-slot.svelte";
  import { formFailure } from "$lib/data/uploads.js";
  import { session } from "$lib/state/session.svelte";
  import { editChart, type EditData, coverUrl, bgmProxyUrl, previewProxyUrl } from "$lib/data/index.js";
  import Modal from "$lib/components/modal.svelte";
  import DeleteChartDialog from "$lib/components/delete-chart-dialog.svelte";
  import VisibilityDialog from "$lib/components/visibility-dialog.svelte";
  import { RiArrowLeftLine, RiEditLine, RiDeleteBinLine, RiEyeLine } from "$lib/icons.js";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const chart = data.chart;

  // Cancel returns to wherever the editor was opened from; a direct visit falls back to the dashboard
  let cancelHref = $state("/dashboard");
  afterNavigate(({ from }) => {
    if (from?.url) cancelHref = from.url.pathname + from.url.search;
  });

  let shown = $state({ status: chart.status, scheduled_publish: chart.scheduled_publish });
  const live = $derived({ ...chart, ...shown });
  let visibilityOpen = $state(false);
  const visibilityLabels = { PUBLIC: "generic.public", UNLISTED: "generic.unlisted", PRIVATE: "generic.private" } as const;
  const visibilityLabel = $derived(t(visibilityLabels[live.status]));
  const releaseLabel = $derived(
    live.scheduled_publish && live.status !== "PUBLIC"
      ? new Date(live.scheduled_publish).toLocaleString(i18n.locale, { dateStyle: "medium", timeStyle: "short" })
      : "",
  );

  let title = $state(chart.title);
  let artists = $state(chart.artists);
  let author = $state(chart.chart_design);
  let rating = $state(String(chart.rating));
  let tags = $state(chart.tags.join(", "));
  let description = $state(chart.description ?? "");

  let chartFile = $state<File | null>(null);
  let jacketFile = $state<File | null>(null);
  let audioFile = $state<File | null>(null);
  let previewFile = $state<File | null>(null);
  let backgroundFile = $state<File | null>(null);
  let removeBackground = $state(false);
  let deleteChartOpen = $state(false);
  let confirmOpen = $state(false);

  function confirmDelete() {
    removeBackground = true;
    backgroundFile = null;
    confirmOpen = false;
  }

  let submitting = $state(false);
  let limits = $state(DEFAULT_LIMITS);
  onMount(() => {
    fetchLimits().then((l) => (limits = l));
  });
  let error = $state<string | null>(null);
  let errorBox = $state<HTMLDivElement | null>(null);

  async function fail(message: string) {
    error = message;
    await tick();
    errorBox?.scrollIntoView({ behavior: "smooth", block: "center" });
    errorBox?.focus({ preventScroll: true });
  }

  const inputClass =
    "bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;

    const key = session.sessionKey;
    if (!key) return fail(t("error.unauthorizedBody"));
    const r = parseInt(rating, 10);
    if (Number.isNaN(r)) return fail(t("upload.ratingNumber"));
    const problem = checkLimits(limits, {
      tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
      rating: r,
      files: { chart: chartFile, jacket: jacketFile, audio: audioFile, preview: previewFile, background: backgroundFile },
    });
    if (problem) return fail(problem);
    // a description that's been set can be changed but not cleared
    if (chart.description && !description.trim()) return fail(t("generic.required", [t("generic.description")]));

    submitting = true;
    const payload: EditData = {};
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (title.trim() !== chart.title) payload.title = title.trim();
    if (artists.trim() !== chart.artists) payload.artists = artists.trim();
    if (author.trim() !== chart.chart_design) payload.author = author.trim();
    if (String(rating) !== String(chart.rating)) payload.rating = r;
    if (description.trim() !== (chart.description ?? "")) payload.description = description.trim();
    if (tagList.join(",") !== chart.tags.join(",")) payload.tags = tagList;
    if (jacketFile) payload.includes_jacket = true;
    if (audioFile) payload.includes_audio = true;
    if (chartFile) payload.includes_chart = true;
    if (previewFile) payload.includes_preview = true;
    if (backgroundFile) payload.includes_background = true;
    if (removeBackground) payload.delete_background = true;

    if (Object.keys(payload).length > 0) {
      const res = await editChart(key, chart.id, payload, {
        chart_file: chartFile,
        jacket_image: jacketFile,
        audio_file: audioFile,
        preview_file: previewFile,
        background_image: backgroundFile,
      });
      if (!res.ok) {
        submitting = false;
        return fail(formFailure(res, { minSeconds: limits.min_music_seconds }));
      }
    }
    submitting = false;
    goto(`/levels/UnCh-${chart.id}`);
  }
</script>

<Seo title={t("edit.edit", [chart.title])} metaTitle={`Edit ${chart.title}`} />

<main class="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("generic.dashboard")}
  </a>

  <header class="space-y-1">
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("generic.editChart")}</h1>
    <p class="text-muted-foreground text-sm">{t("files.editIntro")}</p>
  </header>


  {#if error}
    <div
      bind:this={errorBox}
      tabindex="-1"
      role="alert"
      class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-600 outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:text-rose-300"
    >
      <span class="font-semibold">{t("generic.errorSummary")}</span>
      {error}
    </div>
  {/if}

  <form onsubmit={submit} class="space-y-6">
    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("generic.chartDetails")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.title")}</span>
          <input type="text" bind:value={title} required maxlength={limits.text.title} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.artists")}</span>
          <input type="text" bind:value={artists} required maxlength={limits.text.artists} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.charter")}</span>
          <input type="text" bind:value={author} required maxlength={limits.text.author} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.rating")}</span>
          <input type="number" inputmode="numeric" min={limits.rating.min} max={limits.rating.max} bind:value={rating} required class={inputClass} />
        </label>
        <div class="space-y-1.5 sm:col-span-2">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">{t("generic.tags")} <span class="text-muted-foreground font-normal">{t("generic.optional")}</span></span>
            <input type="text" bind:value={tags} class={inputClass} placeholder={t("generic.commaSeparatedTags")} />
          </label>
        </div>
        <div class="space-y-1.5 sm:col-span-2">
          <span class="text-sm font-medium">{t("generic.description")}{#if !chart.description} <span class="text-muted-foreground font-normal">{t("generic.optional")}</span>{/if}</span>
          <EmojiTextarea
            bind:value={description}
            maxlength={limits.text.description}
            rows={4}
            class="bg-background focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
            required={!!chart.description}
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("generic.files")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
        <FileSlot
          kind="chart"
          label={t("generic.chartFile")}
          limit={limits.files.chart}
          bind:file={chartFile}
          stored={{ src: null, label: t("edit.currentChartFile") }}
          class="sm:col-span-2"
        />
        <FileSlot
          kind="jacket"
          label={t("generic.jacket")}
          limit={limits.files.jacket}
          bind:file={jacketFile}
          stored={{ src: coverUrl(chart), label: t("edit.currentJacket") }}
        />
        <FileSlot
          kind="background"
          label={t("generic.backgroundImage")}
          limit={limits.files.background}
          bind:file={backgroundFile}
          stored={chart.files.background ? { src: chart.files.background, label: t("edit.currentBackground") } : null}
          emptyLabel={t("edit.noBackgroundSet")}
          optional
          removed={removeBackground}
          onremovestored={() => (confirmOpen = true)}
          onundoremove={() => (removeBackground = false)}
          onpick={() => (removeBackground = false)}
        />
        <FileSlot
          kind="audio"
          label={t("generic.musicFile")}
          limit={limits.files.audio}
          minSeconds={limits.min_music_seconds}
          bind:file={audioFile}
          stored={{ src: bgmProxyUrl(chart), label: t("edit.currentMusicFile") }}
        />
        <FileSlot
          kind="preview"
          label={t("generic.musicPreview")}
          limit={limits.files.preview}
          bind:file={previewFile}
          stored={chart.files.preview ? { src: previewProxyUrl(chart), label: t("edit.currentMusicPreview") } : null}
          emptyLabel={t("edit.noPreviewSet")}
        />
      </div>
    </fieldset>

    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <Button href={cancelHref} variant="outline" type="button" class="rounded-full">
        {t("generic.cancel")}
      </Button>
      <Button type="submit" disabled={submitting} class="rounded-full">
        <RiEditLine class="size-4" />
        {submitting ? t("generic.saving") : t("generic.saveChanges")}
      </Button>
    </div>
  </form>

  <section class="bg-card flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-0.5">
      <h2 class="text-base font-semibold">{t("generic.visibility")}</h2>
      <p class="text-sm font-medium">
        {releaseLabel ? `${visibilityLabel} · ${t("dashboard.scheduledFor", [releaseLabel])}` : visibilityLabel}
      </p>
      <p class="text-muted-foreground text-xs">{t(`visibility.hint${live.status}`)}</p>
    </div>
    <Button type="button" variant="outline" onclick={() => (visibilityOpen = true)} class="shrink-0 rounded-full">
      <RiEyeLine class="size-4" />
      {t("edit.editVisibility")}
    </Button>
  </section>

  <section class="flex flex-col gap-3 rounded-2xl border border-rose-500/30 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-0.5">
      <h2 class="text-base font-semibold">{t("generic.deleteChart")}</h2>
    </div>
    <Button
      type="button"
      variant="outline"
      onclick={() => (deleteChartOpen = true)}
      class="shrink-0 rounded-full border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
    >
      <RiDeleteBinLine class="size-4" />
      {t("generic.deleteChart")}
    </Button>
  </section>
</main>

<DeleteChartDialog bind:open={deleteChartOpen} {chart} ondeleted={() => goto("/dashboard")} />

<VisibilityDialog bind:open={visibilityOpen} chart={live} onsaved={(change) => (shown = change)} />

<Modal bind:open={confirmOpen}>
  <div role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-body" class="space-y-4 p-1">
    <div class="space-y-1.5">
      <h2 id="delete-title" class="text-lg font-semibold">{t("edit.deleteBackgroundTitle")}</h2>
      <p id="delete-body" class="text-muted-foreground text-sm">{t("edit.deleteBody")}</p>
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (confirmOpen = false)}>
        {t("generic.cancel")}
      </Button>
      <Button type="button" class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700" onclick={confirmDelete}>
        <RiDeleteBinLine class="size-4" />
        {t("generic.delete")}
      </Button>
    </div>
  </div>
</Modal>
