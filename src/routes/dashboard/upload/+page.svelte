<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { goto } from "$app/navigation";
  import { tick, onMount } from "svelte";
  import { DEFAULT_LIMITS, fetchLimits, checkLimits } from "$lib/data/limits.js";
  import Button from "$lib/components/button.svelte";
  import Select from "$lib/components/select.svelte";
  import EmojiTextarea from "$lib/components/emoji-textarea.svelte";
  import FileSlot from "$lib/components/file-slot.svelte";
  import Checklist from "$lib/components/checklist.svelte";
  import { formFailure, uploadRules } from "$lib/data/uploads.js";
  import { session } from "$lib/state/session.svelte";
  import { uploadChart, type UploadData } from "$lib/data/index.js";
  import { RiArrowLeftLine, RiUpload2Line } from "$lib/icons.js";

  const user = $derived(session.user);

  // uploads always land private; going public or scheduling a release happens on the edit page
  type Visibility = "UNLISTED" | "PRIVATE";
  const visibilityOptions: { value: Visibility; label: string }[] = [
    { value: "PRIVATE", get label() { return t("generic.private"); } },
    { value: "UNLISTED", get label() { return t("generic.unlisted"); } },
  ];

  let title = $state("");
  let artists = $state("");
  let author = $state("");
  let rating = $state("");
  let tags = $state("");
  let description = $state("");
  let visibility = $state<Visibility>("PRIVATE");

  let chartFile = $state<File | null>(null);
  let jacketFile = $state<File | null>(null);
  let audioFile = $state<File | null>(null);
  let previewFile = $state<File | null>(null);
  let backgroundFile = $state<File | null>(null);
  let attempted = $state(false);

  let submitting = $state(false);
  let limits = $state(DEFAULT_LIMITS);
  onMount(() => {
    fetchLimits().then((l) => (limits = l));
  });
  let error = $state<string | null>(null);
  let errorBox = $state<HTMLDivElement | null>(null);
  let confirmed = $state(false);
  let checklistInvalid = $state(false);
  let checklist = $state<{ focusFirst: () => void } | null>(null);
  const rules = $derived(uploadRules(limits.min_music_seconds));
  const visibilityHint = $derived(t(`visibility.hint${visibility}`));

  async function fail(message: string) {
    error = message;
    await tick();
    errorBox?.scrollIntoView({ behavior: "smooth", block: "center" });
    errorBox?.focus({ preventScroll: true });
  }

  $effect(() => {
    if (!author && user?.username) author = user.username;
  });

  const inputClass =
    "bg-background focus-visible:ring-ring/50 h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    attempted = true;
    checklistInvalid = false;

    const key = session.sessionKey;
    if (!key) return fail(t("error.unauthorizedBody"));
    if (!chartFile || !jacketFile || !audioFile) return fail(t("upload.filesRequired"));
    const r = parseInt(rating, 10);
    if (Number.isNaN(r)) return fail(t("upload.ratingNumber"));
    const problem = checkLimits(limits, {
      tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
      rating: r,
      files: { chart: chartFile, jacket: jacketFile, audio: audioFile, preview: previewFile, background: backgroundFile },
    });
    if (problem) return fail(problem);
    if (!description.trim()) return fail(t("generic.required", [t("generic.description")]));
    if (!confirmed) {
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
      status: visibility,
      includes_background: !!backgroundFile,
      includes_preview: !!previewFile,
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
    submitting = false;

    if (res.ok) {
      goto(res.id ? `/levels/UnCh-${res.id}` : "/dashboard");
    } else {
      await fail(formFailure(res, { minSeconds: limits.min_music_seconds }));
    }
  }
</script>

<Seo title={t("generic.uploadChart")} metaTitle="Upload chart" />

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
    <h1 class="font-heading text-2xl font-bold tracking-tight">{t("generic.uploadChart")}</h1>
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
          <input type="text" bind:value={title} required maxlength={limits.text.title} class={inputClass} placeholder={t("upload.titlePlaceholder")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.artists")}</span>
          <input type="text" bind:value={artists} required maxlength={limits.text.artists} class={inputClass} placeholder={t("upload.artistsPlaceholder")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.charter")}</span>
          <input type="text" bind:value={author} required maxlength={limits.text.author} class={inputClass} placeholder={t("upload.charterPlaceholder")} />
        </label>
        <label class="space-y-1.5">
          <span class="text-sm font-medium">{t("generic.rating")}</span>
          <input type="number" inputmode="numeric" min={limits.rating.min} max={limits.rating.max} bind:value={rating} required class={inputClass} placeholder={t("upload.ratingPlaceholder")} />
        </label>
        <div class="space-y-1.5 sm:col-span-2">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium">{t("generic.tags")} <span class="text-muted-foreground font-normal">{t("generic.optional")}</span></span>
            <input type="text" bind:value={tags} class={inputClass} placeholder={t("generic.commaSeparatedTags")} />
          </label>
        </div>
        <div class="space-y-1.5 sm:col-span-2">
          <span class="text-sm font-medium">{t("generic.description")}</span>
          <EmojiTextarea
            bind:value={description}
            maxlength={limits.text.description}
            rows={4}
            class="bg-background focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
            placeholder={t("upload.descriptionPlaceholder")}
            required
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
          invalid={attempted && !chartFile}
          class="sm:col-span-2"
        />
        <FileSlot
          kind="jacket"
          label={t("generic.jacket")}
          limit={limits.files.jacket}
          bind:file={jacketFile}
          invalid={attempted && !jacketFile}
        />
        <FileSlot kind="background" label={t("generic.backgroundImage")} limit={limits.files.background} bind:file={backgroundFile} optional />
        <FileSlot
          kind="audio"
          label={t("generic.musicFile")}
          limit={limits.files.audio}
          minSeconds={limits.min_music_seconds}
          bind:file={audioFile}
          invalid={attempted && !audioFile}
        />
        <FileSlot kind="preview" label={t("generic.musicPreview")} limit={limits.files.preview} bind:file={previewFile} optional />
      </div>
    </fieldset>

    <fieldset class="bg-card clear-both rounded-2xl border p-5">
      <legend class="float-left mb-4 w-full text-base font-semibold">{t("generic.visibility")}</legend>
      <div class="clear-both max-w-xs space-y-1.5">
        <Select bind:value={visibility} options={visibilityOptions} ariaLabel={t("generic.visibility")} class="w-full" />
        <p class="text-muted-foreground text-xs">{visibilityHint}</p>
      </div>
      <p class="text-muted-foreground mt-3 text-sm">{t("upload.publishLater")}</p>
    </fieldset>

    <Checklist
      bind:this={checklist}
      bind:complete={confirmed}
      invalid={checklistInvalid}
      title={t("upload.rulesTitle")}
      hint={t("upload.rulesHint")}
      items={rules}
      required={t("generic.confirmRequired")}
    />

    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <Button href="/dashboard" variant="outline" type="button" class="rounded-full">{t("generic.cancel")}</Button>
      <Button type="submit" disabled={submitting} class="rounded-full">
        <RiUpload2Line class="size-4" />
        {submitting ? t("generic.uploading") : t("generic.uploadChart")}
      </Button>
    </div>
  </form>
</main>
