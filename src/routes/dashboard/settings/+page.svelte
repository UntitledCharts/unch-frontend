<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import LanguageSelect from "$lib/components/language-select.svelte";
  import { prefs, setPref, loadPrefs, type DashboardCardStyle } from "$lib/state/preferences.svelte.js";
  import { onMount } from "svelte";

  const cardStyles: { value: DashboardCardStyle; label: string }[] = [
    { value: "simple", get label() { return t("settings.cardSimple"); } },
    { value: "background", get label() { return t("settings.background"); } },
    { value: "cover", get label() { return t("settings.cardJacketOnly"); } },
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
  import UploadDialog from "$lib/components/upload-dialog.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import AuthorizedApps from "$lib/components/authorized-apps.svelte";
  import { session } from "$lib/state/session.svelte";
  import {
    uploadProfileImage,
    uploadBanner,
    removeProfileImage,
    removeBanner,
    updateAccount,
    DEFAULT_AVATAR,
  } from "$lib/data/index.js";
  import { DEFAULT_LIMITS, fetchLimits } from "$lib/data/limits.js";
  import { formatBytes, formFailure } from "$lib/data/uploads.js";
  import { cn } from "$lib/utils.js";
  import { setMode, userPrefersMode } from "mode-watcher";
  import { accents, setAccent, resetAccent, storedAccentName } from "$lib/state/accent.js";
  import { siteAssets } from "$lib/state/site-assets.svelte.js";
  import {
    RiArrowLeftLine,
    RiImageEditLine,
    RiDeleteBinLine,
    RiCheckLine,
    RiHeart3Fill,
  } from "$lib/icons.js";

  const user = $derived(session.user);

  const modes = [
    { value: "light", get label() { return t("settings.themeLight"); } },
    { value: "dark", get label() { return t("settings.themeDark"); } },
    { value: "system", get label() { return t("settings.themeSystem"); } },
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

  let pickerOpen = $state(false);
  let cropOpen = $state(false);
  let cropType = $state<"pfp" | "banner">("pfp");
  let cropImage = $state<string | null>(null);
  let cropError = $state<string | null>(null);

  let limits = $state(DEFAULT_LIMITS);
  onMount(() => {
    fetchLimits().then((l) => (limits = l));
  });
  const cropLimit = $derived(cropType === "pfp" ? limits.files.avatar : limits.files.banner);

  let saving = $state(false);
  let justSaved = $state(false);
  let errorMsg = $state<string | null>(null);

  function openPicker(type: "pfp" | "banner") {
    cropType = type;
    pickerOpen = true;
  }

  function startCrop(file: File) {
    if (cropImage) URL.revokeObjectURL(cropImage);
    cropImage = URL.createObjectURL(file);
    cropError = null;
    cropOpen = true;
  }

  function onCropApply(file: File) {
    if (file.size > cropLimit) {
      cropError = t("settings.cropTooLarge", [formatBytes(cropLimit)]);
      return;
    }
    if (cropType === "pfp") {
      if (pfpPreview) URL.revokeObjectURL(pfpPreview);
      pfpFile = file;
      pfpPreview = URL.createObjectURL(file);
    } else {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      bannerFile = file;
      bannerPreview = URL.createObjectURL(file);
    }
    cropOpen = false;
  }

  // what's saved on the account; a picked image that isn't saved yet is only discarded
  const hasAvatar = $derived(!!user?.avatar && user.avatar !== DEFAULT_AVATAR);
  const hasBanner = $derived(!!user?.banner && user.banner !== siteAssets.banner);

  let removeOpen = $state(false);
  let removeType = $state<"pfp" | "banner">("pfp");
  let removing = $state(false);
  let removeError = $state<string | null>(null);

  function discard(type: "pfp" | "banner") {
    if (type === "pfp") {
      if (pfpPreview) URL.revokeObjectURL(pfpPreview);
      pfpFile = null;
      pfpPreview = null;
    } else {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      bannerFile = null;
      bannerPreview = null;
    }
  }

  function askRemove(type: "pfp" | "banner") {
    if (!(type === "pfp" ? hasAvatar : hasBanner)) return discard(type);
    removeType = type;
    removeError = null;
    removeOpen = true;
  }

  async function confirmRemove() {
    const key = session.sessionKey;
    if (!key) return;
    removing = true;
    removeError = null;
    const res = await (removeType === "pfp" ? removeProfileImage(key) : removeBanner(key));
    removing = false;
    if (!res.ok) {
      removeError = t("settings.removeFailed");
      return;
    }
    discard(removeType);
    removeOpen = false;
    await session.init();
  }

  async function save() {
    const key = session.sessionKey;
    if (!key || !user) {
      errorMsg = t("error.unauthorizedBody");
      return;
    }
    saving = true;
    errorMsg = null;
    let failure: string | null = null;
    if (pfpFile) {
      const res = await uploadProfileImage(key, pfpFile);
      if (res.ok) pfpFile = null;
      else failure ??= formFailure(res, { kind: "avatar" });
    }
    if (bannerFile) {
      const res = await uploadBanner(key, bannerFile);
      if (res.ok) bannerFile = null;
      else failure ??= formFailure(res, { kind: "banner" });
    }
    const res = await updateAccount(key, { description: description.trim() });
    if (!res.ok) failure ??= formFailure(res);
    saving = false;
    session.init();
    if (failure) {
      errorMsg = failure;
    } else {
      justSaved = true;
      setTimeout(() => (justSaved = false), 1800);
    }
  }

  const bannerSrc = $derived(bannerPreview ?? user?.banner ?? null);
  const pfpSrc = $derived(pfpPreview ?? user?.avatar ?? null);
  const dirty = $derived(!!pfpFile || !!bannerFile || (user ? description.trim() !== (user.description ?? "") : false));
</script>

<Seo title={t("generic.settings")} metaTitle="Settings" />

<main class="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  {#if session.isLoggedIn}
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("generic.dashboard")}
  </a>
  {/if}

  <header class="space-y-1">
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("generic.settings")}</h1>
    <p class="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
  </header>

  {#if session.isLoggedIn}
  <section id="profile" class="bg-card ring-border/70 scroll-mt-24 rounded-2xl border ring-1">
    <div class="relative overflow-hidden rounded-t-2xl">
      {#if bannerSrc}
        <div class="h-28 bg-cover bg-center sm:h-36" style={`background-image:url(${bannerSrc})`}></div>
      {:else}
        <div class="from-primary/25 to-card h-28 bg-linear-to-br sm:h-36"></div>
      {/if}
      <div class="absolute top-3 right-3 flex flex-wrap justify-end gap-2">
        {#if hasBanner || bannerFile}
          <button
            type="button"
            onclick={() => askRemove("banner")}
            class="bg-background/70 hover:bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-rose-600 shadow-sm backdrop-blur transition-colors dark:text-rose-400"
          >
            <RiDeleteBinLine class="size-4" />
            <span class="sr-only sm:not-sr-only">{t("settings.removeBackground")}</span>
          </button>
        {/if}
        <button
          type="button"
          onclick={() => openPicker("banner")}
          class="bg-background/70 hover:bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors"
        >
          <RiImageEditLine class="size-4" /> {t("settings.changeBackground")}
        </button>
      </div>
    </div>

    <div class="px-5 pb-5">
      <div class="-mt-10 flex items-end gap-3">
        <div class="relative w-fit">
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
        {#if hasAvatar || pfpFile}
          <button
            type="button"
            onclick={() => askRemove("pfp")}
            class="hover:bg-muted mb-0.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors dark:text-rose-400"
          >
            <RiDeleteBinLine class="size-4" /> {t("settings.removeProfilePicture")}
          </button>
        {/if}
      </div>

      <div class="mt-3 min-w-0">
        <p class="font-heading truncate text-lg font-bold tracking-tight">{user?.username ?? ""}</p>
        <p class="text-muted-foreground text-sm">#{user?.handle ?? ""} · {user?.role ?? ""}</p>
      </div>

      <div class="mt-5 space-y-1.5">
        <span class="text-muted-foreground text-xs font-medium">{t("generic.description")}</span>
        <EmojiTextarea
          bind:value={description}
          rows={4}
          maxlength={2000}
          placeholder={t("settings.bioPlaceholder")}
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
          {saving ? t("generic.saving") : justSaved ? t("generic.saved") : t("generic.saveChanges")}
        </Button>
      </div>
    </div>
  </section>
  {:else if !session.loading}
    <section class="bg-card ring-border/70 flex flex-col items-start gap-3 rounded-2xl border p-5 ring-1 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-muted-foreground text-sm">{t("settings.accountSignedOut")}</p>
      <Button size="sm" class="shrink-0 rounded-full" onclick={() => session.login()}>{t("generic.logIn")}</Button>
    </section>
  {/if}

  <section class="bg-card ring-border/70 space-y-3 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("settings.appearance")}</h2>
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

  </section>

  <section class="bg-card ring-border/70 space-y-3 rounded-2xl border p-5 ring-1">
    <div class="space-y-0.5">
      <h2 class="font-semibold">{t("generic.language")}</h2>
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
        {t("generic.reset")}
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
  </section>

  {#if session.isLoggedIn}
    <AuthorizedApps />
  {/if}
</main>

<UploadDialog
  bind:open={pickerOpen}
  kind={cropType === "pfp" ? "avatar" : "banner"}
  label={cropType === "pfp" ? t("settings.profilePicture") : t("settings.background")}
  limit={cropType === "pfp" ? limits.files.avatar : limits.files.banner}
  paste
  confirmLabel={t("generic.next")}
  onconfirm={startCrop}
/>

<Modal bind:open={cropOpen}>
  <div class="p-1">
    <h2 class="mb-3 text-base font-semibold">
      {cropType === "pfp" ? t("settings.profilePicture") : t("settings.background")}
    </h2>

    {#if cropImage}
      {#key cropImage}
        <ImageCropper
          image={cropImage}
          aspect={cropType === "pfp" ? 1 : 3}
          round={false}
          onapply={onCropApply}
          oncancel={() => (cropOpen = false)}
        />
      {/key}
    {/if}
    {#if cropError}<p role="alert" class="mt-3 text-sm text-rose-500">{cropError}</p>{/if}
  </div>
</Modal>

<Modal bind:open={removeOpen}>
  <div role="alertdialog" aria-labelledby="remove-image-title" aria-describedby="remove-image-body" class="space-y-4 p-1">
    <div class="flex gap-3">
      <span class="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-500">
        <RiDeleteBinLine class="size-5" />
      </span>
      <div class="space-y-1.5">
        <h2 id="remove-image-title" class="text-lg font-semibold">
          {removeType === "pfp" ? t("settings.removeProfilePictureTitle") : t("settings.removeBackgroundTitle")}
        </h2>
        <p id="remove-image-body" class="text-muted-foreground text-sm">{t("settings.removeImageBody")}</p>
      </div>
    </div>
    {#if removeError}<p role="alert" class="text-sm text-rose-500">{removeError}</p>{/if}
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (removeOpen = false)}>
        {t("generic.cancel")}
      </Button>
      <Button
        type="button"
        disabled={removing}
        onclick={confirmRemove}
        class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
      >
        <RiDeleteBinLine class="size-4" />
        {removing ? t("generic.removing") : t("generic.remove")}
      </Button>
    </div>
  </div>
</Modal>
