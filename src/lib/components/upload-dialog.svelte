<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { onMount } from "svelte";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import Waveform from "./waveform.svelte";
  import { FILE_RULES, acceptsLabel, checkFile, describeFile, type FileDetails, type FileKind } from "$lib/data/uploads.js";
  import { RiErrorWarningLine, RiFileCodeLine, RiImageAddLine, RiUpload2Line } from "$lib/icons.js";

  // one file for one field: picked, dropped anywhere while open, or pasted when `paste` is on (images by
  // default); checked right away and only handed to onconfirm once accepted
  let {
    open = $bindable(false),
    kind,
    label,
    limit,
    minSeconds = 0,
    paste,
    confirmLabel,
    onconfirm,
  }: {
    open?: boolean;
    kind: FileKind;
    label: string;
    limit: number;
    minSeconds?: number;
    paste?: boolean;
    confirmLabel?: string;
    onconfirm: (file: File, details: FileDetails) => void;
  } = $props();

  const uid = $props.id();
  const rule = $derived(FILE_RULES[kind]);
  const canPaste = $derived(paste ?? rule.media === "image");

  let input = $state<HTMLInputElement>();
  let candidate = $state<{ file: File; details: FileDetails } | null>(null);
  let error = $state<string | null>(null);
  let checking = $state(false);
  let dragging = $state(false);
  let pasteKey = $state("Ctrl+V");
  let token = 0;

  onMount(() => {
    if (/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)) pasteKey = "⌘V";
  });

  const url = $derived(candidate && rule.media !== "chart" ? URL.createObjectURL(candidate.file) : null);
  $effect(() => {
    const current = url;
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  });

  $effect(() => {
    if (open) return;
    token++;
    candidate = null;
    error = null;
    checking = false;
    dragging = false;
  });

  async function take(file: File | null | undefined) {
    if (!file) return;
    const mine = ++token;
    error = null;
    checking = true;
    const result = await checkFile(kind, file, limit, minSeconds);
    if (mine !== token) return;
    checking = false;
    if (result.ok) candidate = { file, details: result.details };
    else error = result.error;
  }

  export function offer(file: File) {
    open = true;
    take(file);
  }

  function picked(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    take(el.files?.[0]);
    el.value = "";
  }

  const carriesFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes("Files");

  function dragover(e: DragEvent) {
    if (!open || !carriesFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dragging = true;
  }

  function dragleave(e: DragEvent) {
    if (open && !e.relatedTarget) dragging = false;
  }

  function drop(e: DragEvent) {
    if (!open || !carriesFiles(e)) return;
    e.preventDefault();
    dragging = false;
    take(e.dataTransfer?.files[0]);
  }

  function pasted(e: ClipboardEvent) {
    if (!open || !canPaste) return;
    const file = e.clipboardData?.files[0];
    if (!file) return;
    e.preventDefault();
    take(file);
  }

  function confirm() {
    if (!candidate || checking) return;
    const { file, details } = candidate;
    open = false;
    onconfirm(file, details);
  }

  const Icon = $derived(rule.media === "image" ? RiImageAddLine : RiUpload2Line);
</script>

<svelte:window ondragover={dragover} ondragleave={dragleave} ondrop={drop} onpaste={pasted} />

<Modal bind:open class="max-w-lg" labelledby={`${uid}-title`} describedby={`${uid}-hint`}>
  <div class="space-y-4 p-1">
    <div class="space-y-1">
      <h2 id={`${uid}-title`} class="text-lg font-semibold">{label}</h2>
      <p id={`${uid}-hint`} class="text-muted-foreground text-sm">
        {acceptsLabel(kind, limit, minSeconds)}
      </p>
    </div>

    <input bind:this={input} type="file" accept={rule.accept} onchange={picked} class="hidden" tabindex="-1" aria-hidden="true" />

    {#if candidate}
      <div class="bg-muted/40 space-y-3 rounded-xl border p-3">
        {#if rule.media === "image" && url}
          <div class="bg-background grid place-items-center overflow-hidden rounded-lg">
            <img src={url} alt={t("files.previewOf", [candidate.file.name])} class="max-h-56 w-auto max-w-full object-contain" />
          </div>
        {:else if rule.media === "audio" && url}
          <Waveform id={`${uid}-wave`} src={url} height={48} />
        {/if}
        <div class="flex items-center gap-3">
          {#if rule.media === "chart"}
            <span class="bg-background grid size-10 shrink-0 place-items-center rounded-lg border">
              <RiFileCodeLine class="text-muted-foreground size-5" />
            </span>
          {/if}
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{candidate.file.name}</p>
            <p class="text-muted-foreground text-xs">{describeFile(candidate.file, candidate.details)}</p>
          </div>
        </div>
      </div>
    {/if}

    <button
      type="button"
      onclick={() => input?.click()}
      class={cn(
        "focus-visible:ring-ring/50 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition-colors outline-none focus-visible:ring-2",
        candidate ? "min-h-24 py-4" : "min-h-44 py-8",
        dragging ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-foreground/30",
      )}
    >
      <Icon class={cn("opacity-70", candidate ? "size-6" : "size-9")} />
      <span class="text-sm font-medium">
        {dragging ? t("files.dropToUse") : candidate ? t("files.chooseAnother") : t("files.dropOrChoose")}
      </span>
      {#if canPaste}
        <span class="text-xs opacity-70 pointer-coarse:hidden">{t("files.pasteHint", [pasteKey])}</span>
      {/if}
    </button>

    <div aria-live="polite" class="empty:hidden">
      {#if checking}
        <p class="text-muted-foreground text-sm">{t("files.checking")}</p>
      {:else if error}
        <p class="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
          <RiErrorWarningLine class="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      {/if}
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" class="rounded-full" onclick={() => (open = false)}>{t("generic.cancel")}</Button>
      <Button class="rounded-full" disabled={!candidate || checking} onclick={confirm}>
        {confirmLabel ?? t("files.useFile")}
      </Button>
    </div>
  </div>
</Modal>
