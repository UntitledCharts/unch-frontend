<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import Seo from "$lib/components/seo.svelte";
  import BackLink from "$lib/components/back-link.svelte";
  import Button from "$lib/components/button.svelte";
  import { ogSiteUrl } from "$lib/config.js";
  import { formatBytes, formatsLabel, uploadRules, type FileKind } from "$lib/data/uploads.js";
  import { RiErrorWarningLine, RiExternalLinkLine, RiMusic2Line } from "$lib/icons.js";

  let { data } = $props();

  const EDITOR = "https://next-sekai-editor.sonolus.com/";
  const CHART_FORMATS = [".sus", ".usc", "LevelData", "PJSK"];

  const rules = $derived(uploadRules(data.limits.min_music_seconds));
  const publicRules = $derived([
    t("uploadPolicy.noOfficialCharts"),
    t("uploadPolicy.noJokeCharts"),
    t("uploadPolicy.noWip"),
    t("uploadPolicy.correctMetadata"),
  ]);

  const fileKinds: { kind: Exclude<FileKind, "avatar" | "banner">; label: string }[] = [
    { kind: "chart", label: "generic.chartFile" },
    { kind: "jacket", label: "generic.jacket" },
    { kind: "audio", label: "generic.musicFile" },
    { kind: "preview", label: "generic.musicPreview" },
    { kind: "background", label: "generic.backgroundImage" },
  ];

  // the old strings mark their emphasis with <strong>; odd parts are the bold ones
  const emphasis = (text: string) => text.split(/<strong>(.*?)<\/strong>/);
</script>

<Seo
  title={t("uploadPolicy.title")}
  metaTitle="Upload Policy"
  description="Before you post on UntitledCharts, please ensure you are following the rules, and review the file formats and sizes allowed."
  image={ogSiteUrl("Upload Policy", "Rules that every chart on UntitledCharts must follow.")}
/>

<SiteHeader />

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
  <BackLink href="/" label={t("generic.home")} />

  <h1 class="font-heading mt-6 text-3xl font-bold sm:text-4xl">{t("uploadPolicy.title")}</h1>
  <p class="text-muted-foreground mt-2 text-[15px] leading-relaxed">{t("uploadPolicy.subtitle")}</p>

  <div class="mt-10 space-y-10 text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold">
    <section class="space-y-3">
      <h2>{t("uploadPolicy.everyChartTitle")}</h2>
      <p class="text-foreground/85">{t("uploadPolicy.everyChartHint")}</p>
      <ol class="bg-card divide-y rounded-2xl border">
        {#each rules as rule, i (i)}
          <li class="flex gap-3 px-5 py-3.5">
            <span class="text-muted-foreground min-w-5 font-semibold tabular-nums">{i + 1}.</span>
            <span>{rule}</span>
          </li>
        {/each}
      </ol>
    </section>

    <section class="space-y-3">
      <h2>{t("uploadPolicy.publicTitle")}</h2>
      <p class="text-foreground/85">{t("uploadPolicy.publicHint")}</p>
      <ol class="bg-card divide-y rounded-2xl border">
        {#each publicRules as rule, i (i)}
          <li class="flex gap-3 px-5 py-3.5">
            <span class="text-muted-foreground min-w-5 font-semibold tabular-nums">{rules.length + i + 1}.</span>
            <span>{rule}</span>
          </li>
        {/each}
      </ol>
      <p class="text-foreground/85 flex items-start gap-2 text-sm">
        <RiMusic2Line class="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{t("uploadPolicy.previewRequired")}</span>
      </p>
    </section>

    <section class="space-y-3">
      <h2>{t("uploadPolicy.fileSizeLimits")}</h2>
      <dl class="bg-card divide-y rounded-2xl border">
        {#each fileKinds as file (file.kind)}
          <div class="flex items-center justify-between gap-4 px-5 py-3">
            <dt class="min-w-0">
              <span class="block text-sm font-medium">{t(file.label)}</span>
              <span class="text-muted-foreground block text-xs">{formatsLabel(file.kind)}</span>
            </dt>
            <dd class="shrink-0 text-sm font-semibold tabular-nums">{formatBytes(data.limits.files[file.kind])}</dd>
          </div>
        {/each}
      </dl>
      <p class="text-foreground/85">
        {#each emphasis(t("uploadPolicy.fileSizeDesc")) as part, i (i)}{#if i % 2}<strong class="text-foreground">{part}</strong>{:else}{part}{/if}{/each}
      </p>
      <p class="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        <RiErrorWarningLine class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{t("uploadPolicy.shitpostWarning")}</span>
      </p>
    </section>

    <section class="space-y-3">
      <h2>{t("uploadPolicy.supportedFileTypes")}</h2>
      <ul class="flex flex-wrap gap-2">
        {#each CHART_FORMATS as format (format)}
          <li class="border-primary/25 bg-primary/10 text-primary rounded-full border px-3 py-1 font-mono text-sm font-semibold">
            {format}
          </li>
        {/each}
      </ul>
      <p class="text-foreground/85">
        {#each emphasis(t("uploadPolicy.fileTypesNote")) as part, i (i)}{#if i % 2}<strong class="text-foreground">{part}</strong>{:else}{part}{/if}{/each}
      </p>
      <Button href={EDITOR} target="_blank" rel="noopener noreferrer" variant="outline" class="rounded-full">
        <RiExternalLinkLine class="size-4" />
        {t("uploadPolicy.openEditor")}
      </Button>
    </section>
  </div>
</main>

<SiteFooter />
