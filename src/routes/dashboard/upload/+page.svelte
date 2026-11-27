<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import PublicChecklist from "$lib/components/public-checklist.svelte";
  import { goto } from "$app/navigation";
  import { tick, onMount } from "svelte";
  import { DEFAULT_LIMITS, fetchLimits, checkLimits } from "$lib/data/limits.js";
  import Button from "$lib/components/button.svelte";
  import Select from "$lib/components/select.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import TagSuggestions from "$lib/components/tag-suggestions.svelte";
  import { session } from "$lib/state/session.svelte";
  import { uploadChart, scheduleChart, type UploadData } from "$lib/data/index.js";
  import ReleaseTime, { toLocalInput } from "$lib/components/release-time.svelte";
  import { RiArrowLeftLine, RiUpload2Line } from "$lib/icons.js";

  const user = $derived(session.user);

  // "SCHEDULED" isn't a status the API knows: the chart is stored private and released at releaseAt
  type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE" | "SCHEDULED";
  const visibilityOptions: { value: Visibility; label: string }[] = [
    { value: "PUBLIC", get label() { return t("dashboard.statusPublic"); } },
    { value: "UNLISTED", get label() { return t("dashboard.statusUnlisted"); } },
    { value: "PRIVATE", get label() { return t("dashboard.statusPrivate"); } },
    { value: "SCHEDULED", get label() { return t("dashboard.statusScheduled"); } },
  ];

  let title = $state("");
  let artists = $state("");
  let author = $state("");
  let rating = $state("");
  let tags = $state("");
  let description = $state("");
  let visibility = $state<Visibility>("PUBLIC");
  let releaseAt = $state(toLocalInput(new Date(Date.now() + 24 * 3600 * 1000)));
  const willSchedule = $derived(visibility === "SCHEDULED");

  let chartFile = $state<File | null>(null);
  let jacketFile = $state<File | null>(null);
  let audioFile = $state<File | null>(null);
  let previewFile = $state<File | null>(null);
  let backgroundFile = $state<File | null>(null);

  let submitting = $state(false);
  let limits = $state(DEFAULT_LIMITS);
  onMount(() => {
    fetchLimits().then((l) => (limits = l));
  });
  let error = $state<string | null>(null);
  let confirmed = $state(false);
  let checklistInvalid = $state(false);
  let checklist = $state<{ focusFirst: () => void } | null>(null);
  let errorBox = $state<HTMLDivElement | null>(null);
  // a scheduled chart goes public on its own later, so it gets the same checklist
  const needsConfirm = $derived(visibility === "PUBLIC" || willSchedule);
  const visibilityHint = $derived(t(`dashboard.visibilityHint${visibility}`));

  async function fail(message: string) {
    error = message;
    await tick();
    errorBox?.scrollIntoView({ behavior: "smooth", block: "center" });
    errorBox?.focus({ preventScroll: true });
  }

  $effect(() => {
    if (!author && user?.username) author = user.username;
  });

  function pick(e: Event): File | null {
    const target = e.target as HTMLInputElement;
    return target.files && target.files[0] ? target.files[0] : null;
  }

  const inputClass =
    "bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";
  const fileClass =
    "bg-background w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground";

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;

    checklistInvalid = false;

    const key = session.sessionKey;
    if (!key) return fail(t("upload.loginRequired"));
    if (!chartFile || !jacketFile || !audioFile) return fail(t("upload.filesRequired"));
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
    const data: UploadData = {
      rating: r,
      title: title.trim(),
      artists: artists.trim(),
      author: author.trim(),
      description: description.trim(),
      includes_background: !!backgroundFile,
      includes_preview: !!previewFile,
      status: willSchedule ? "PRIVATE" : visibility,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const res = await uploadChart(key, data, {
      chart_file: chartFile,
      jacket_image: jacketFile,
      audio_file: audioFile,
      preview_file: previewFile,
      background_image: backgroundFile,
    });

    if (res.ok && willSchedule && !(res.id && (await scheduleChart(key, res.id, releaseDate)))) {
      // the files are up, so don't make them upload again; the editor can retry the schedule
      submitting = false;
      return goto(res.id ? `/dashboard/edit/UnCh-${res.id}?schedule=failed` : "/dashboard");
    }
    submitting = false;

    if (res.ok) {
      goto(res.id ? `/levels/UnCh-${res.id}` : "/dashboard");
    } else {
      await fail(res.error);
    }
  }
</script>

<svelte:head>
  <title>{t("upload.uploadAChartUntitledcharts")}</title>
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
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("dashboard.uploadANewChart")}</h1>
    <p class="text-muted-foreground text-sm">
      {t("upload.fillInTheDetailsAnd")}
    </p>
  </header>

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

  <form onsubmit={submit} class="space-y-6">
    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("upload.sectionDetails")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.title")}</span>
          <input type="text" bind:value={title} required maxlength={limits.text.title} class={inputClass} placeholder={t("upload.chartTitle")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.artists")}</span>
          <input type="text" bind:value={artists} required maxlength={limits.text.artists} class={inputClass} placeholder={t("upload.songArtistS")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("edit.charter")}</span>
          <input type="text" bind:value={author} required maxlength={limits.text.author} class={inputClass} placeholder={t("upload.chartDesignerName")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("search.rating")}</span>
          <input type="number" inputmode="numeric" min={limits.rating.min} max={limits.rating.max} bind:value={rating} required class={inputClass} placeholder={t("upload.ratingPlaceholder")} />
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
            placeholder={t("upload.bpmNoteCountCreditsType")}
          />
        </div>
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("upload.sectionFiles")}</legend>
      <div class="clear-both grid gap-4 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("upload.chartFile")}</span>
          <input type="file" required onchange={(e) => (chartFile = pick(e))} class={fileClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("upload.coverImage")}</span>
          <input type="file" required accept="image/*" onchange={(e) => (jacketFile = pick(e))} class={fileClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("upload.musicFile")}</span>
          <input type="file" required accept="audio/*" onchange={(e) => (audioFile = pick(e))} class={fileClass} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("upload.audioPreview")} <span class="text-muted-foreground font-normal">{t("upload.optional")}</span></span>
          <input type="file" accept="audio/*" onchange={(e) => (previewFile = pick(e))} class={fileClass} />
        </label>
        <label class="space-y-1.5 sm:col-span-2">
          <span class="text-sm font-medium">{t("upload.backgroundImage")} <span class="text-muted-foreground font-normal">{t("upload.optional")}</span></span>
          <input type="file" accept="image/*" onchange={(e) => (backgroundFile = pick(e))} class={fileClass} />
        </label>
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("dashboard.visibility")}</legend>
      <div class="clear-both max-w-xs space-y-1.5">
        <Select bind:value={visibility} options={visibilityOptions} ariaLabel={t("dashboard.visibility")} class="w-full" />
        <p class="text-muted-foreground text-xs">{visibilityHint}</p>
        {#if willSchedule}<div class="pt-2"><ReleaseTime bind:value={releaseAt} /></div>{/if}
      </div>
    </fieldset>

    {#if needsConfirm}
      <PublicChecklist bind:this={checklist} bind:complete={confirmed} invalid={checklistInvalid} />
    {/if}

    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <Button href="/dashboard" variant="outline" type="button" class="rounded-full">{t("oauth.cancel")}</Button>
      <Button type="submit" disabled={submitting} class="rounded-full">
        <RiUpload2Line class="size-4" />
        {submitting ? t("upload.uploading") : willSchedule
            ? t("upload.uploadAndSchedule")
            : needsConfirm
              ? t("upload.uploadAndPublish")
              : t("upload.uploadChart")}
      </Button>
    </div>
  </form>
</main>
