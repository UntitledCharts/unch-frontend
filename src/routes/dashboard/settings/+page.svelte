<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import LanguageSelect from "$lib/components/language-select.svelte";
  import { prefs, setPref, loadPrefs, clampPageSize, DEFAULT_PAGE_SIZE, PAGE_SIZE_MIN, PAGE_SIZE_MAX, type DashboardCardStyle, type DashboardPaging } from "$lib/state/preferences.svelte.js";
  import { onMount } from "svelte";

  const pagingOptions: { value: DashboardPaging; label: string }[] = [
    { value: "pages", get label() { return t("settings.pagingPages"); } },
    { value: "infinite", get label() { return t("settings.pagingInfinite"); } },
  ];
  // the typed value stays as typed until it's committed (blur or Enter), then it's clamped and saved
  let sizeDraft = $state("");
  $effect(() => {
    sizeDraft = String(prefs.dashboardPageSize);
  });
  function commitSize() {
    const n = Number.parseInt(sizeDraft, 10);
    const size = Number.isNaN(n) ? prefs.dashboardPageSize : clampPageSize(n);
    setPref("dashboardPageSize", size);
    sizeDraft = String(size);
  }
  const cardStyles: { value: DashboardCardStyle; label: string }[] = [
    { value: "simple", get label() { return t("settings.cardSimple"); } },
    { value: "background", get label() { return t("settings.cardBackground"); } },
    { value: "cover", get label() { return t("settings.cardCoverOnly"); } },
  ];
  let prefsMounted = $state(false);
  onMount(() => {
    loadPrefs();
    prefsMounted = true;
  });
  import Button from "$lib/components/button.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import Modal from "$lib/components/modal.svelte";
  import ImageCropper from "$lib/components/image-cropper.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import AuthorizedApps from "$lib/components/authorized-apps.svelte";
  import { session } from "$lib/state/session.svelte";
  import { uploadProfileImage, uploadBanner, updateAccount } from "$lib/data/index.js";
  import { cn } from "$lib/utils.js";
  import { setMode, userPrefersMode } from "mode-watcher";
  import { accents, setAccent, resetAccent, storedAccentName } from "$lib/state/accent.js";
  import {
    RiArrowLeftLine,
    RiImageEditLine,
    RiImageAddLine,
    RiCheckLine,
    RiHeart3Fill,
  } from "$lib/icons.js";

  const user = $derived(session.user);

  const modes = [
    { value: "light", get label() { return t("header.light"); } },
    { value: "dark", get label() { return t("header.dark"); } },
    { value: "system", get label() { return t("header.system"); } },
  ] as const;

  let activeAccent = $state("Violet");
  let themeMounted = $state(false);
  $effect(() => {
    themeMounted = true;
    activeAccent = storedAccentName();
  });

  function applyAccent(a: { name: string; color: string }) {
    activeAccent = a.name;
    setAccent(a.name);
  }
  function clearAccent() {
    activeAccent = "Violet";
    resetAccent();
  }

  let description = $state("");
  let descInit = false;
  $effect(() => {
    if (!descInit && user) {
      description = user.description ?? "";
      descInit = true;
    }
  });

  let pfpFile = $state<File | null>(null);
  let bannerFile = $state<File | null>(null);
  let pfpPreview = $state<string | null>(null);
  let bannerPreview = $state<string | null>(null);

  let cropOpen = $state(false);
  let cropType = $state<"pfp" | "banner">("pfp");
  let cropImage = $state<string | null>(null);
  let dragOver = $state(false);
  let fileInput = $state<HTMLInputElement>();

  let saving = $state(false);
  let justSaved = $state(false);
  let errorMsg = $state<string | null>(null);

  function openPicker(type: "pfp" | "banner") {
    cropType = type;
    cropImage = null;
    cropOpen = true;
  }

  function useFile(f: File | undefined | null) {
    if (f && f.type.startsWith("image/")) cropImage = URL.createObjectURL(f);
  }
  function onSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    useFile(input.files?.[0]);
    input.value = "";
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    useFile(e.dataTransfer?.files?.[0]);
  }

  function onCropApply(file: File) {
    if (cropType === "pfp") {
      pfpFile = file;
      pfpPreview = URL.createObjectURL(file);
    } else {
      bannerFile = file;
      bannerPreview = URL.createObjectURL(file);
    }
    cropOpen = false;
    cropImage = null;
  }

  async function save() {
    const key = session.sessionKey;
    const id = user?.sonolus_id;
    if (!key || !id) {
      errorMsg = t("settings.loginRequired");
      return;
    }
    saving = true;
    errorMsg = null;
    let profile_hash: string | undefined;
    let banner_hash: string | undefined;
    if (pfpFile) {
      const h = await uploadProfileImage(key, id, pfpFile);
      if (h) profile_hash = h;
    }
    if (bannerFile) {
      const h = await uploadBanner(key, id, bannerFile);
      if (h) banner_hash = h;
    }
    const ok = await updateAccount(key, id, { description: description.trim(), profile_hash, banner_hash });
    saving = false;
    if (ok) {
      pfpFile = null;
      bannerFile = null;
      justSaved = true;
      session.init();
      setTimeout(() => (justSaved = false), 1800);
    } else {
      errorMsg = t("settings.saveFailed");
    }
  }

  const bannerSrc = $derived(bannerPreview ?? user?.banner ?? null);
  const pfpSrc = $derived(pfpPreview ?? user?.avatar ?? null);
  const dirty = $derived(!!pfpFile || !!bannerFile || (user ? description.trim() !== (user.description ?? "") : false));
</script>

<svelte:head>
  <title>{t("settings.settingsUntitledcharts")}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  {#if session.isLoggedIn}
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("nav.dashboard")}
  </a>
  {/if}

  <header class="space-y-1">
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
    <p class="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
  </header>

  {#if session.isLoggedIn}
  <section class="bg-card ring-border/70 rounded-2xl border ring-1">
    <div class="relative overflow-hidden rounded-t-2xl">
      {#if bannerSrc}
        <div class="h-28 bg-cover bg-center sm:h-36" style={`background-image:url(${bannerSrc})`}></div>
      {:else}
        <div class="from-primary/25 to-card h-28 bg-linear-to-br sm:h-36"></div>
      {/if}
      <button
        type="button"
        onclick={() => openPicker("banner")}
        class="bg-background/70 hover:bg-background absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors"
      >
        <RiImageEditLine class="size-4" /> {t("settings.changeBackground")}
      </button>
    </div>

    <div class="px-5 pb-5">
      <div class="-mt-10 w-fit">
        <div class="relative">
          <CoverArt
            id={user?.username ?? "guest"}
            title={user?.username ?? "?"}
            src={pfpSrc}
            rounded="rounded-2xl"
            class="size-20"
          />
          <button
            type="button"
            onclick={() => openPicker("pfp")}
            aria-label={t("settings.changeProfilePicture")}
            class="bg-primary text-primary-foreground absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full shadow-md transition-transform hover:scale-105"
          >
            <RiImageEditLine class="size-4" />
          </button>
        </div>
      </div>

      <div class="mt-3 min-w-0">
        <p class="font-heading truncate text-lg font-bold tracking-tight">{user?.username ?? ""}</p>
        <p class="text-muted-foreground text-sm">#{user?.handle ?? ""} · {user?.role ?? ""}</p>
      </div>

      <div class="mt-5 space-y-1.5">
        <span class="text-muted-foreground text-xs font-medium">{t("levelDetail.description")}</span>
        <EmojiTextarea
          bind:value={description}
          rows={4}
          maxlength={2000}
          placeholder={t("settings.tellPeopleAboutYourCharts")}
          class="bg-card focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
        />
        <span class="text-muted-foreground block text-right text-[11px] tabular-nums">{description.length}/2000</span>
      </div>

      <div class="mt-3 flex items-center justify-end gap-3">
        {#if errorMsg}
          <span class="text-sm font-medium text-rose-500">{errorMsg}</span>
        {/if}
        <Button
          onclick={save}
          disabled={saving || (!dirty && !justSaved)}
          class={cn(
            "rounded-full transition-colors",
            justSaved && "!border-emerald-500 !bg-emerald-500 !text-white",
          )}
        >
          {saving ? t("edit.saving") : justSaved ? t("settings.saved") : t("edit.saveChanges")}
        </Button>
      </div>
    </div>
  </section>
  {:else if !session.loading}
    <section class="bg-card ring-border/70 flex flex-col items-start gap-3 rounded-2xl border p-5 ring-1 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-muted-foreground text-sm">{t("settings.accountSignedOut")}</p>
      <Button size="sm" class="shrink-0 rounded-full" onclick={() => session.login()}>{t("nav.login")}</Button>
    </section>
  {/if}

  <section class="bg-card ring-border/70 space-y-3 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("settings.appearance")}</h2>
      <p class="text-muted-foreground text-sm">{t("settings.appearanceHint")}</p>
    </div>
    <div class="bg-muted/50 inline-flex items-center rounded-xl border p-1">
      {#each modes as m (m.value)}
        {@const active = themeMounted && userPrefersMode.current === m.value}
        <button
          type="button"
          onclick={() => setMode(m.value)}
          aria-pressed={active}
          class={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="bg-card ring-border/70 space-y-3 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("settings.dashboardCards")}</h2>
      <p class="text-muted-foreground text-sm">{t("settings.dashboardCardsHint")}</p>
    </div>
    <div class="bg-muted/50 inline-flex items-center rounded-xl border p-1" role="radiogroup" aria-label={t("settings.dashboardCards")}>
      {#each cardStyles as c (c.value)}
        {@const active = prefsMounted && prefs.dashboardCards === c.value}
        <button
          type="button"
          role="radio"
          aria-checked={active}
          onclick={() => setPref("dashboardCards", c.value)}
          class={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c.label}
        </button>
      {/each}
    </div>

    <div class="space-y-0.5 pt-2">
      <h3 class="text-sm font-semibold">{t("settings.dashboardPaging")}</h3>
      <p class="text-muted-foreground text-sm">{t("settings.dashboardPagingHint")}</p>
    </div>
    <div class="bg-muted/50 inline-flex flex-wrap items-center rounded-xl border p-1" role="radiogroup" aria-label={t("settings.dashboardPaging")}>
      {#each pagingOptions as o (o.value)}
        {@const active = prefsMounted && prefs.dashboardPaging === o.value}
        <button
          type="button"
          role="radio"
          aria-checked={active}
          onclick={() => setPref("dashboardPaging", o.value)}
          class={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      {/each}
    </div>
    {#if prefsMounted && prefs.dashboardPaging === "pages"}
      <div class="flex flex-wrap items-center gap-2">
        <label for="page-size" class="text-sm">{t("settings.cardsPerPage")}</label>
        <input
          id="page-size"
          type="number"
          inputmode="numeric"
          min={PAGE_SIZE_MIN}
          max={PAGE_SIZE_MAX}
          bind:value={sizeDraft}
          onblur={commitSize}
          onkeydown={(e) => e.key === "Enter" && commitSize()}
          class="bg-background focus-visible:ring-ring/50 h-9 w-20 rounded-lg border px-3 text-sm tabular-nums outline-none focus-visible:ring-2"
        />
        {#if prefs.dashboardPageSize !== DEFAULT_PAGE_SIZE}
          <button
            type="button"
            onclick={() => setPref("dashboardPageSize", DEFAULT_PAGE_SIZE)}
            class="text-muted-foreground hover:text-foreground hover:bg-muted h-9 rounded-lg px-3 text-sm transition-colors"
          >
            {t("settings.resetTo", [String(DEFAULT_PAGE_SIZE)])}
          </button>
        {/if}
      </div>
    {/if}
  </section>

  <section class="bg-card ring-border/70 space-y-3 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("settings.language")}</h2>
      <p class="text-muted-foreground text-sm">{t("settings.languageHint")}</p>
    </div>
    <LanguageSelect class="w-full sm:w-72" />
  </section>

  <section class="bg-card ring-border/70 space-y-4 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("settings.accent")}</h2>
      <p class="text-muted-foreground text-sm">{t("settings.accentHint")}</p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      {#each accents as a (a.name)}
        <button
          type="button"
          onclick={() => applyAccent(a)}
          aria-label={a.name}
          aria-pressed={activeAccent === a.name}
          class={cn(
            "ring-offset-card grid size-9 place-items-center rounded-full ring-2 ring-offset-2 transition-transform hover:scale-105",
            activeAccent === a.name ? "ring-foreground/60" : "ring-transparent",
          )}
          style="background-color: {a.color}"
        >
          {#if activeAccent === a.name}
            <span style="color: {a.fg}"><RiCheckLine class="size-4" /></span>
          {/if}
        </button>
      {/each}
      <button
        type="button"
        onclick={clearAccent}
        class="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
      >
        {t("settings.reset")}
      </button>
    </div>

    <div class="border-border/60 flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
      <Button size="sm" class="rounded-full">{t("settings.primaryButton")}</Button>
      <LevelBadge level={32} />
      <span class="text-primary inline-flex items-center gap-1 text-sm font-medium">
        <RiHeart3Fill class="size-4" />
        {t("settings.accentLink")}
      </span>
    </div>

    <p class="text-muted-foreground text-xs">{t("settings.accentChangesApplyLiveBut")}</p>
  </section>

  {#if session.isLoggedIn}
    <AuthorizedApps />
  {/if}
</main>

<Modal bind:open={cropOpen}>
  <div class="p-1">
    <h2 class="mb-3 text-base font-semibold">
      {cropType === "pfp" ? t("settings.profilePicture") : t("settings.background")}
    </h2>

    <input
      bind:this={fileInput}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onchange={onSelect}
      class="hidden"
    />

    {#if cropImage}
      <ImageCropper
        image={cropImage}
        aspect={cropType === "pfp" ? 1 : 3}
        round={false}
        onapply={onCropApply}
        oncancel={() => (cropOpen = false)}
      />
    {:else}
      <button
        type="button"
        onclick={() => fileInput?.click()}
        ondragover={(e) => {
          e.preventDefault();
          dragOver = true;
        }}
        ondragleave={() => (dragOver = false)}
        ondrop={onDrop}
        class={`flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-foreground/30"}`}
      >
        <RiImageAddLine class="size-9 opacity-70" />
        <span class="text-sm font-medium">{t("settings.dropAnImageHereOr")}</span>
        <span class="text-xs opacity-70">
          {t("settings.pngJpegOrWebp", [cropType === "pfp" ? t("settings.aspectSquare") : t("settings.aspectWide")])}
        </span>
      </button>
    {/if}
  </div>
</Modal>
