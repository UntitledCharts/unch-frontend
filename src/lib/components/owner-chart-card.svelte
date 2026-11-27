<script lang="ts">
  import type { Chart } from "$lib/data/index.js";
  import { compact, coverUrl, backgroundUrl } from "$lib/data/index.js";
  import CoverArt from "./cover-art.svelte";
  import LevelBadge from "./level-badge.svelte";
  import FormattedText from "./formatted-text.svelte";
  import { RiHeart3Fill, RiChat3Line, RiStarFill, RiEditLine, RiLinksLine, RiCheckLine } from "$lib/icons.js";
  import { t, i18n } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { prefs } from "$lib/state/preferences.svelte.js";
  import { SITE_URL } from "$lib/config.js";

  // One of the charter's own charts on the dashboard, in the style picked in settings. The title opens
  // the chart; Edit and Copy link are always on the card, so there's nothing hidden behind hover or a sheet.
  let { chart }: { chart: Chart } = $props();

  const editHref = $derived(`/dashboard/edit/UnCh-${chart.id}`);
  const viewHref = $derived(`/levels/UnCh-${chart.id}`);

  const cover = $derived(coverUrl(chart));
  const statusLabel = $derived(
    chart.status === "PUBLIC"
      ? t("dashboard.statusPublic")
      : chart.scheduled_publish
        ? t("dashboard.scheduledFor", [
            new Date(chart.scheduled_publish).toLocaleString(i18n.locale, { dateStyle: "medium", timeStyle: "short" }),
          ])
        : chart.status === "UNLISTED"
          ? t("dashboard.statusUnlisted")
          : t("dashboard.statusPrivate"),
  );
  let copied = $state(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}${viewHref}`);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      void 0;
    }
  }
</script>

{#snippet status()}
  <span
    class={cn(
      "inline-flex min-w-0 items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-bold",
      chart.staff_pick ? "bg-amber-400 text-amber-950" : "bg-muted text-muted-foreground",
    )}
  >
    {#if chart.staff_pick}<RiStarFill class="size-2.5" /> {t("common.staff")}{:else}{statusLabel}{/if}
  </span>
{/snippet}

{#snippet title(cls: string)}
  <a href={viewHref} class={cn("block truncate font-bold hover:underline", cls)}><FormattedText text={chart.title} /></a>
{/snippet}

{#snippet stats(cls: string)}
  <span class={cn("text-muted-foreground flex shrink-0 items-center gap-3 tabular-nums [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1", cls)}>
    <span><RiHeart3Fill class="size-3 text-rose-400" />{compact(chart.like_count)}</span>
    <span><RiChat3Line class="size-3" />{compact(chart.comment_count)}</span>
  </span>
{/snippet}

<!-- Edit is the main action; Copy link is icon-only next to it -->
{#snippet actions(cls: string, small = false, iconOnly = false)}
  <div class={cn("flex items-center gap-1.5", cls)}>
    <a
      href={editHref}
      aria-label={iconOnly ? t("dashboard.edit") : undefined}
      title={iconOnly ? t("dashboard.edit") : undefined}
      class={cn(
        "bg-primary text-primary-foreground inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-[filter] hover:brightness-110",
        iconOnly ? "size-8 shrink-0" : small ? "h-8 flex-1 px-3 text-xs" : "h-9 flex-1 px-4 text-sm",
      )}
    >
      <RiEditLine class="size-4" />
      {#if !iconOnly}{t("dashboard.edit")}{/if}
    </a>
    <button
      type="button"
      onclick={copyLink}
      aria-label={t("dashboard.copyLink")}
      title={copied ? t("levelDetail.linkCopied") : t("dashboard.copyLink")}
      class={cn(
        "bg-secondary text-secondary-foreground hover:bg-muted grid shrink-0 place-items-center rounded-full transition-colors",
        small ? "size-8" : "size-9",
      )}
    >
      {#if copied}<RiCheckLine class="size-4" />{:else}<RiLinksLine class="size-4" />{/if}
    </button>
  </div>
{/snippet}

{#if prefs.dashboardCards === "cover"}
  <article class="bg-card flex h-full flex-col overflow-hidden rounded-2xl">
    <a href={viewHref} class="relative block" aria-label={chart.title}>
      <CoverArt id={chart.id} title={chart.title} src={cover} rounded="rounded-none" class="aspect-square w-full" />
      <LevelBadge level={chart.rating} size="sm" onImage class="absolute top-2 left-2" />
    </a>
    <div class="flex flex-1 flex-col gap-2 p-3">
      <div class="min-w-0">
        {@render title("text-sm")}
        <p class="text-muted-foreground truncate text-xs"><FormattedText text={chart.artists} /></p>
      </div>
      <div class="flex min-w-0 items-center justify-between gap-2">
        {@render status()}
        {@render stats("text-[11px]")}
      </div>
      {@render actions("mt-auto", true)}
    </div>
  </article>
{:else if prefs.dashboardCards === "background"}
  <article class="bg-card relative flex h-full flex-col overflow-hidden rounded-3xl">
    <div class="relative">
      <a href={viewHref} class="block aspect-16/7 w-full overflow-hidden" aria-label={chart.title} tabindex="-1">
        <CoverArt id={`${chart.id}-bg`} src={backgroundUrl(chart)} rounded="rounded-none" class="size-full" />
        <span class="from-card absolute inset-0 bg-linear-to-t to-transparent to-60%"></span>
      </a>
      <CoverArt
        id={chart.id}
        title={chart.title}
        src={cover}
        rounded="rounded-2xl"
        class="absolute bottom-0 left-4 z-20 size-24 translate-y-1/2 shadow-lg"
      />
      <LevelBadge level={chart.rating} size="sm" onImage class="absolute top-3 right-3" />
      <span class="absolute top-3 left-3 max-w-[60%]">{@render status()}</span>
      <!-- the strip of banner right of the cover holds the actions -->
      {@render actions("absolute right-3 bottom-2 left-32 z-10", true)}
    </div>

    <div class="flex flex-1 flex-col gap-2 px-4 pt-15 pb-4">
      <div class="min-w-0">
        {@render title("text-lg")}
        <p class="text-muted-foreground truncate text-sm"><FormattedText text={chart.artists} /></p>
      </div>
      <div class="mt-auto flex items-center justify-between gap-2 text-xs">
        <span class="text-accent min-w-0 truncate font-bold"><FormattedText text={chart.chart_design} /></span>
        {@render stats("")}
      </div>
    </div>
  </article>
{:else}
  <article class="bg-card flex items-center gap-3 rounded-2xl p-2.5">
    <a href={viewHref} class="shrink-0" aria-label={chart.title} tabindex="-1">
      <CoverArt id={chart.id} title={chart.title} src={cover} rounded="rounded-xl" class="size-18" />
    </a>

    <div class="min-w-0 flex-1">
      <div class="flex min-w-0 items-center gap-1.5">
        <LevelBadge level={chart.rating} size="sm" />
        {@render status()}
      </div>
      {@render title("mt-1 text-sm")}
      <p class="text-muted-foreground truncate text-xs"><FormattedText text={chart.artists} /></p>
      {@render stats("mt-0.5 text-[11px]")}
    </div>

    {@render actions("shrink-0 flex-col", true, true)}
  </article>
{/if}
