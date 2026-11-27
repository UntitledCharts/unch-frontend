<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import PublicChecklist from "$lib/components/public-checklist.svelte";
  import { goto, afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { tick, onMount } from "svelte";
  import { DEFAULT_LIMITS, fetchLimits, checkLimits } from "$lib/data/limits.js";
  import Button from "$lib/components/button.svelte";
  import Select from "$lib/components/select.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import TagSuggestions from "$lib/components/tag-suggestions.svelte";
  import { session } from "$lib/state/session.svelte";
  import { editChart, scheduleChart, type EditData, coverUrl, backgroundUrl } from "$lib/data/index.js";
  import Modal from "$lib/components/modal.svelte";
  import DeleteChartDialog from "$lib/components/delete-chart-dialog.svelte";
  import ReleaseTime, { toLocalInput } from "$lib/components/release-time.svelte";
  import {
    RiArrowLeftLine,
    RiEditLine,
    RiMusic2Line,
    RiFileMusicLine,
    RiFileCodeLine,
    RiImageLine,
    RiDeleteBinLine,
    RiArrowGoBackLine,
  } from "$lib/icons.js";

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const chart = data.chart;

  // Cancel returns to wherever the editor was opened from; a direct visit falls back to the dashboard
  let cancelHref = $state("/dashboard");
  afterNavigate(({ from }) => {
    if (from?.url) cancelHref = from.url.pathname + from.url.search;
  });

  const user = $derived(session.user);
  const isOwner = $derived(!user || user.handle === chart.author_handle);

  // "SCHEDULED" isn't a status the API knows: the chart is stored private and released at releaseAt
  type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE" | "SCHEDULED";
  const visibilityOptions: { value: Visibility; label: string }[] = [
    { value: "PUBLIC", get label() { return t("dashboard.statusPublic"); } },
    { value: "UNLISTED", get label() { return t("dashboard.statusUnlisted"); } },
    { value: "PRIVATE", get label() { return t("dashboard.statusPrivate"); } },
    { value: "SCHEDULED", get label() { return t("dashboard.statusScheduled"); } },
  ];

  let title = $state(chart.title);
  let artists = $state(chart.artists);
  let author = $state(chart.chart_design);
  let rating = $state(String(chart.rating));
  let tags = $state(chart.tags.join(", "));
  let description = $state(chart.description ?? "");
  const wasScheduled = !!chart.scheduled_publish && chart.status !== "PUBLIC";
  let visibility = $state<Visibility>(wasScheduled ? "SCHEDULED" : chart.status);
  let releaseAt = $state(
    toLocalInput(wasScheduled ? new Date(chart.scheduled_publish!) : new Date(Date.now() + 24 * 3600 * 1000)),
  );

  let chartFile = $state<File | null>(null);
  let jacketFile = $state<File | null>(null);
  let audioFile = $state<File | null>(null);
  let previewFile = $state<File | null>(null);
  let backgroundFile = $state<File | null>(null);
  let removePreview = $state(false);
  let removeBackground = $state(false);
  let pendingDelete = $state<"preview" | "background" | null>(null);
  let deleteChartOpen = $state(false);
  let confirmOpen = $state(false);

  function askDelete(target: "preview" | "background") {
    pendingDelete = target;
    confirmOpen = true;
  }

  function confirmDelete() {
    if (pendingDelete === "preview") {
      removePreview = true;
      previewFile = null;
    } else if (pendingDelete === "background") {
      removeBackground = true;
      backgroundFile = null;
    }
    confirmOpen = false;
  }

  let submitting = $state(false);
  let limits = $state(DEFAULT_LIMITS);
  onMount(() => {
    fetchLimits().then((l) => (limits = l));
  });
  // the upload page lands here when the files went up but scheduling the release didn't
  // svelte-ignore state_referenced_locally
  let error = $state<string | null>(page.url.searchParams.get("schedule") === "failed" ? t("edit.uploadScheduleFailed") : null);
  let confirmed = $state(false);
  let checklistInvalid = $state(false);
  let checklist = $state<{ focusFirst: () => void } | null>(null);
  let errorBox = $state<HTMLDivElement | null>(null);
  const wasPublic = chart.status === "PUBLIC";
  const willSchedule = $derived(visibility === "SCHEDULED");
  const status = $derived(willSchedule ? "PRIVATE" : (visibility as Exclude<Visibility, "SCHEDULED">));

  const needsConfirm = $derived((visibility === "PUBLIC" || willSchedule) && !wasPublic);
  const visibilityHint = $derived(t(`dashboard.visibilityHint${visibility}`));
  // a public chart can't be pulled back into a scheduled release
  const options = $derived(wasPublic ? visibilityOptions.filter((o) => o.value !== "SCHEDULED") : visibilityOptions);

  async function fail(message: string) {
    error = message;
    await tick();
    errorBox?.scrollIntoView({ behavior: "smooth", block: "center" });
    errorBox?.focus({ preventScroll: true });
  }

  function pick(e: Event): File | null {
    const target = e.target as HTMLInputElement;
    return target.files && target.files[0] ? target.files[0] : null;
  }

  const jacketPreview = $derived(jacketFile ? URL.createObjectURL(jacketFile) : null);
  const backgroundPreview = $derived(backgroundFile ? URL.createObjectURL(backgroundFile) : null);
  const currentBackground = $derived(backgroundUrl(chart));

  const inputClass =
    "bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;

    checklistInvalid = false;

    const key = session.sessionKey;
    if (!key) return fail(t("edit.loginRequired"));
    const r = parseInt(rating, 10);
    if (Number.isNaN(r)) return fail(t("upload.ratingNumber"));
    const problem = checkLimits(limits, {
      tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
      rating: r,
      files: { chart: chartFile, jacket: jacketFile, audio: audioFile, preview: previewFile, background: backgroundFile },
    });
    if (problem) return fail(problem);
    const releaseDate = new Date(releaseAt);
    if (willSchedule && !(releaseDate.getTime() > Date.now())) return fail(t("edit.scheduleInPast"));
    if (needsConfirm && !confirmed) {
      checklistInvalid = true;
      await tick();
      checklist?.focusFirst();
      return;
    }

    submitting = true;
    const payload: EditData = {
      title: title.trim(),
      artists: artists.trim(),
      author: author.trim(),
      rating: r,
      description: description.trim(),
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      includes_jacket: !!jacketFile,
      includes_audio: !!audioFile,
      includes_chart: !!chartFile,
      includes_preview: !!previewFile,
      includes_background: !!backgroundFile,
      delete_background: removeBackground,
      delete_preview: removePreview,
    };
    const res = await editChart(
      key,
      chart.id,
      payload,
      {
        chart_file: chartFile ?? undefined,
        jacket_image: jacketFile ?? undefined,
        audio_file: audioFile ?? undefined,
        preview_file: previewFile,
        background_image: backgroundFile,
      },
      status !== chart.status,
    );

    if (res.ok && (willSchedule || wasScheduled)) {
      const at = willSchedule ? releaseDate : null;
      const unchanged = willSchedule && wasScheduled && at!.getTime() === new Date(chart.scheduled_publish!).getTime();
      if (!unchanged && !(await scheduleChart(key, chart.id, at))) {
        submitting = false;
        return fail(t("edit.scheduleFailed"));
      }
    }
    submitting = false;

    if (res.ok) {
      goto(`/levels/UnCh-${chart.id}`);
    } else {
      await fail(res.error);
    }
  }
</script>

<svelte:head>
  <title>{t("edit.editUntitledcharts", [chart.title])}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("nav.dashboard")}
  </a>

  <header class="space-y-1">
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("levelDetail.editChart")}</h1>
    <p class="text-muted-foreground text-sm">{t("edit.updateDetailsOrReplaceFiles")}</p>
  </header>

  {#if !isOwner}
    <div
      class="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
    >
      {t("edit.thisIsnTOneOf")}
    </div>
  {/if}

  {#if error}
    <div
      bind:this={errorBox}
      tabindex="-1"
      role="alert"
      class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-600 outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:text-rose-300"
    >
      <span class="font-semibold">{t("upload.errorSummary")}</span>
      {error}
    </div>
  {/if}

  {#snippet fileField(o: {
    label: string;
    accept: string;
    onchange: (e: Event) => void;
    selected: File | null;
    thumb: string | null;
    icon: typeof RiMusic2Line;
    currentLabel: string;
    removed?: boolean;
    onDelete?: () => void;
    onUndo?: () => void;
  })}
    {@const Icon = o.icon}
    <div class="space-y-1.5">
      <span class="text-sm font-medium">{o.label}</span>
      <div class="bg-background flex items-center gap-2 rounded-xl border p-2.5">
        <label class="hover:bg-accent/40 -m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 transition-colors">
          <input type="file" accept={o.accept} onchange={o.onchange} class="sr-only" />
          <div class="bg-muted grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg">
            {#if o.thumb && !o.removed}
              <img src={o.thumb} alt="" class="size-full object-cover" />
            {:else}
              <Icon class="text-muted-foreground size-5" />
            {/if}
          </div>
          <div class="min-w-0 flex-1">
            <p class={cn("truncate text-sm font-medium", o.removed && "text-muted-foreground line-through")}>
              {o.selected ? o.selected.name : o.currentLabel}
            </p>
            <p class={cn("truncate text-xs", o.removed ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {o.selected ? t("edit.newFileSelected") : o.removed ? t("edit.willBeRemoved") : t("edit.clickReplaceToChange")}
            </p>
          </div>
          <span class="bg-primary text-primary-foreground shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold">
            {t("edit.replace")}
          </span>
        </label>
        {#if o.removed && o.onUndo}
          <button
            type="button"
            onclick={o.onUndo}
            class="hover:bg-muted inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <RiArrowGoBackLine class="size-3.5" />
            {t("common.undo")}
          </button>
        {:else if o.onDelete && !o.selected}
          <button
            type="button"
            onclick={o.onDelete}
            aria-label={t("edit.deleteFile", [o.label])}
            class="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
          >
            <RiDeleteBinLine class="size-3.5" />
            {t("edit.delete")}
          </button>
        {/if}
      </div>
    </div>
  {/snippet}

  <form onsubmit={submit} class="space-y-6">
    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("upload.sectionDetails")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.title")}</span>
          <input type="text" bind:value={title} required maxlength={limits.text.title} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.artists")}</span>
          <input type="text" bind:value={artists} required maxlength={limits.text.artists} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.charter")}</span>
          <input type="text" bind:value={author} required maxlength={limits.text.author} class={inputClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("search.rating")}</span>
          <input type="number" inputmode="numeric" min={limits.rating.min} max={limits.rating.max} bind:value={rating} required class={inputClass} />
        </label>
        <div class="space-y-1.5 sm:col-span-2">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">{t("search.tags")} <span class="text-muted-foreground font-normal">{t("upload.optional")}</span></span>
            <input type="text" bind:value={tags} class={inputClass} placeholder={t("search.tagsPlaceholder")} />
          </label>
          <TagSuggestions bind:value={tags} />
        </div>
        <div class="space-y-1.5 sm:col-span-2">
          <span class="text-sm font-medium">{t("levelDetail.description")} <span class="text-muted-foreground font-normal">{t("upload.optional")}</span></span>
          <EmojiTextarea
            bind:value={description}
            maxlength={limits.text.description}
            rows={4}
            class="bg-background focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
            placeholder={t("edit.typeForEmojis")}
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("upload.sectionFiles")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
      {@render fileField({
        label: t("upload.coverImage"),
        accept: "image/*",
        onchange: (e) => (jacketFile = pick(e)),
        selected: jacketFile,
        thumb: jacketPreview ?? coverUrl(chart),
        icon: RiImageLine,
        currentLabel: t("edit.currentCover"),
      })}
      {@render fileField({
        label: t("upload.backgroundImage"),
        accept: "image/*",
        onchange: (e) => {
          backgroundFile = pick(e);
          if (backgroundFile) removeBackground = false;
        },
        selected: backgroundFile,
        thumb: backgroundPreview ?? (chart.custom_background ? currentBackground : null),
        icon: RiImageLine,
        currentLabel: chart.custom_background ? t("edit.currentBackground") : t("edit.noBackgroundSet"),
        removed: removeBackground,
        onDelete: chart.custom_background ? () => askDelete("background") : undefined,
        onUndo: () => (removeBackground = false),
      })}
      {@render fileField({
        label: t("upload.chartFile"),
        accept: "",
        onchange: (e) => (chartFile = pick(e)),
        selected: chartFile,
        thumb: null,
        icon: RiFileCodeLine,
        currentLabel: t("edit.currentChartFile"),
      })}
      {@render fileField({
        label: t("upload.musicFile"),
        accept: "audio/*",
        onchange: (e) => (audioFile = pick(e)),
        selected: audioFile,
        thumb: null,
        icon: RiFileMusicLine,
        currentLabel: t("edit.currentMusicFile"),
      })}
      {@render fileField({
        label: t("upload.audioPreview"),
        accept: "audio/*",
        onchange: (e) => {
          previewFile = pick(e);
          if (previewFile) removePreview = false;
        },
        selected: previewFile,
        thumb: null,
        icon: RiMusic2Line,
        currentLabel: chart.preview_file_hash ? t("edit.currentAudioPreview") : t("edit.noPreviewSet"),
        removed: removePreview,
        onDelete: chart.preview_file_hash ? () => askDelete("preview") : undefined,
        onUndo: () => (removePreview = false),
      })}
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("dashboard.visibility")}</legend>
      <div class="clear-both max-w-xs space-y-1.5">
        <Select bind:value={visibility} {options} ariaLabel={t("dashboard.visibility")} class="w-full" />
        <p class="text-muted-foreground text-xs">{visibilityHint}</p>
        {#if willSchedule}<div class="pt-2"><ReleaseTime bind:value={releaseAt} /></div>{/if}
      </div>
    </fieldset>

    {#if needsConfirm}
      <PublicChecklist bind:this={checklist} bind:complete={confirmed} invalid={checklistInvalid} />
    {/if}

    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <Button href={cancelHref} variant="outline" type="button" class="rounded-full">
        {t("oauth.cancel")}
      </Button>
      <Button type="submit" disabled={submitting} class="rounded-full">
        <RiEditLine class="size-4" />
        {submitting
          ? t("edit.saving")
          : willSchedule
            ? t("edit.saveAndSchedule")
            : needsConfirm
              ? t("edit.saveAndPublish")
              : t("edit.saveChanges")}
      </Button>
    </div>
  </form>

  <section class="flex flex-col gap-3 rounded-2xl border border-rose-500/30 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-0.5">
      <h2 class="text-base font-semibold">{t("deleteChart.dangerZone")}</h2>
      <p class="text-muted-foreground text-sm">{t("deleteChart.dangerHint")}</p>
    </div>
    <Button
      type="button"
      variant="outline"
      onclick={() => (deleteChartOpen = true)}
      class="shrink-0 rounded-full border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
    >
      <RiDeleteBinLine class="size-4" />
      {t("deleteChart.confirm")}
    </Button>
  </section>
</main>

<DeleteChartDialog bind:open={deleteChartOpen} {chart} ondeleted={() => goto("/dashboard")} />

<Modal bind:open={confirmOpen}>
  <div role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-body" class="space-y-4 p-1">
    <div class="space-y-1.5">
      <h2 id="delete-title" class="text-lg font-semibold">
        {pendingDelete === "preview" ? t("edit.deletePreviewTitle") : t("edit.deleteBackgroundTitle")}
      </h2>
      <p id="delete-body" class="text-muted-foreground text-sm">{t("edit.deleteBody")}</p>
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (confirmOpen = false)}>
        {t("oauth.cancel")}
      </Button>
      <Button type="button" class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700" onclick={confirmDelete}>
        <RiDeleteBinLine class="size-4" />
        {t("edit.delete")}
      </Button>
    </div>
  </div>
</Modal>
