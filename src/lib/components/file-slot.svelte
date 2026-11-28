<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import UploadDialog from "./upload-dialog.svelte";
  import Waveform from "./waveform.svelte";
  import { FILE_RULES, acceptsLabel, checkFile, describeFile, type FileDetails, type FileKind } from "$lib/data/uploads.js";
  import {
    RiArrowGoBackLine,
    RiDeleteBinLine,
    RiFileCodeLine,
    RiFileMusicLine,
    RiImageLine,
    RiMusic2Line,
    RiUpload2Line,
  } from "$lib/icons.js";

  type Stored = { src: string | null; label: string; detail?: string };

  // `stored` is what the chart has saved (edit page, null when nothing is), left out on the upload page
  let {
    kind,
    label,
    limit,
    minSeconds = 0,
    file = $bindable(null),
    stored,
    emptyLabel,
    optional = false,
    invalid = false,
    removed = false,
    paste,
    onremovestored,
    onundoremove,
    onpick,
    class: className,
  }: {
    kind: FileKind;
    label: string;
    limit: number;
    minSeconds?: number;
    file?: File | null;
    stored?: Stored | null;
    emptyLabel?: string;
    optional?: boolean;
    invalid?: boolean;
    removed?: boolean;
    paste?: boolean;
    onremovestored?: () => void;
    onundoremove?: () => void;
    onpick?: (file: File) => void;
    class?: string;
  } = $props();

  const uid = $props.id();
  const media = $derived(FILE_RULES[kind].media);
  const editing = $derived(stored !== undefined);
  const keeps = $derived(!!stored && !removed);

  let root = $state<HTMLDivElement>();
  let dialog = $state<{ offer: (file: File) => void } | null>(null);
  let dialogOpen = $state(false);
  let dragging = $state(false);
  let details = $state<FileDetails | null>(null);

  export function choose() {
    root?.scrollIntoView({ behavior: "smooth", block: "center" });
    dialogOpen = true;
  }

  const carriesFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes("Files");

  function dragover(e: DragEvent) {
    if (!carriesFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dragging = true;
  }

  function dragleave(e: DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) dragging = false;
  }

  // a file dropped on the field still goes through the dialog's checks and preview
  function drop(e: DragEvent) {
    if (!carriesFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    const dropped = e.dataTransfer?.files[0];
    if (dropped) dialog?.offer(dropped);
  }

  $effect(() => {
    const current = file;
    details = null;
    if (!current) return;
    let live = true;
    checkFile(kind, current, limit, minSeconds).then((result) => {
      if (live && result.ok) details = result.details;
    });
    return () => {
      live = false;
    };
  });

  const fileUrl = $derived(file && media !== "chart" ? URL.createObjectURL(file) : null);
  $effect(() => {
    const current = fileUrl;
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  });

  const src = $derived(fileUrl ?? (keeps ? (stored?.src ?? null) : null));
  const title = $derived(file ? file.name : stored ? stored.label : (emptyLabel ?? t("files.noFile")));
  const detail = $derived(
    file
      ? describeFile(file, details)
      : stored
        ? removed
          ? t("edit.appliedOnSave")
          : (stored.detail ?? "")
        : acceptsLabel(kind, limit),
  );

  const Icon = $derived(media === "image" ? RiImageLine : media === "chart" ? RiFileCodeLine : kind === "preview" ? RiMusic2Line : RiFileMusicLine);

  const pill = "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";
</script>

<div bind:this={root} class={cn("min-w-0 space-y-1.5", className)}>
  <span id={`${uid}-label`} class="block text-sm font-medium">
    {label}
    {#if optional}<span class="text-muted-foreground font-normal">{t("generic.optional")}</span>{/if}
  </span>
  <div
    role="group"
    aria-labelledby={`${uid}-label`}
    aria-describedby={invalid ? `${uid}-error` : undefined}
    ondragover={dragover}
    ondragleave={dragleave}
    ondrop={drop}
    class={cn(
      "bg-background space-y-3 rounded-xl border p-3 transition-colors",
      invalid && "border-rose-500/70",
      dragging && "border-primary bg-primary/5",
    )}
  >
    <div class="flex items-center gap-3">
      <div
        class={cn(
          "bg-muted grid shrink-0 place-items-center overflow-hidden rounded-lg",
          media !== "image" ? "size-12" : kind === "background" ? "aspect-video h-20" : "size-20",
          removed && !file && "opacity-40 grayscale",
        )}
      >
        {#if media === "image" && src}
          <img src={src} alt={t("files.previewOf", [title])} class="size-full object-cover" />
        {:else}
          <Icon class="text-muted-foreground size-5" />
        {/if}
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <div class="min-w-0">
          <p class="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            <span class={cn("truncate", removed && !file && "text-muted-foreground line-through")}>{title}</span>
            {#if file && editing}
              <span class="bg-primary/15 text-primary shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase">
                {t("files.new")}
              </span>
            {/if}
          </p>
          {#if detail}
            <p class={cn("truncate text-xs", removed && !file ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {detail}
            </p>
          {/if}
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onclick={() => (dialogOpen = true)}
            aria-label={t(file || keeps ? "files.replaceField" : "files.uploadField", [label])}
            class={cn(pill, "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            <RiUpload2Line class="size-3.5" />
            {file || keeps ? t("generic.replace") : t("generic.upload")}
          </button>
          {#if file && editing}
            <button
              type="button"
              onclick={() => (file = null)}
              aria-label={t("files.undoField", [label])}
              class={cn(pill, "hover:bg-muted border")}
            >
              <RiArrowGoBackLine class="size-3.5" />
              {t("generic.undo")}
            </button>
          {:else if file && optional}
            <button
              type="button"
              onclick={() => (file = null)}
              aria-label={t("files.removeField", [label])}
              class={cn(pill, "border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400")}
            >
              <RiDeleteBinLine class="size-3.5" />
              {t("generic.remove")}
            </button>
          {:else if !file && keeps && onremovestored}
            <button
              type="button"
              onclick={onremovestored}
              aria-label={t("files.removeField", [label])}
              class={cn(pill, "border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400")}
            >
              <RiDeleteBinLine class="size-3.5" />
              {t("generic.remove")}
            </button>
          {:else if !file && removed && onundoremove}
            <button
              type="button"
              onclick={onundoremove}
              aria-label={t("files.undoField", [label])}
              class={cn(pill, "hover:bg-muted border")}
            >
              <RiArrowGoBackLine class="size-3.5" />
              {t("generic.undo")}
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if media === "audio" && src}
      {#key src}
        <Waveform id={`${uid}-wave`} {src} variant="compact" height={32} lazy={fileUrl ? false : kind === "audio" ? "play" : true} />
      {/key}
    {/if}
  </div>
  {#if invalid}
    <p id={`${uid}-error`} class="text-destructive text-xs">{t("files.required")}</p>
  {/if}
</div>

<UploadDialog
  bind:this={dialog}
  bind:open={dialogOpen}
  {kind}
  {label}
  {limit}
  {minSeconds}
  {paste}
  onconfirm={(picked) => {
    file = picked;
    onpick?.(picked);
  }}
/>
