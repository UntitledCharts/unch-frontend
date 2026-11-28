<script lang="ts">
  import GradeLabel from "$lib/components/grade-label.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import CoverArt from "$lib/components/cover-art.svelte";
  import LevelBadge from "$lib/components/level-badge.svelte";
  import FormattedText from "$lib/components/formatted-text.svelte";
  import AccountBadges from "$lib/components/account-badges.svelte";
  import Seo from "$lib/components/seo.svelte";
  import AdSlot from "$lib/components/ad-slot.svelte";
  import { cn } from "$lib/utils.js";
  import {
    coverUrl,
    backgroundUrl,
    profileUrl,
    grouped,
    formatAccuracy,
    relativeTime,
  } from "$lib/data/index.js";
  import { RiArrowLeftLine } from "$lib/icons.js";
  import { sonolusOpenUrl, ogChartUrl } from "$lib/config.js";

  let { data } = $props();
  const chart = $derived(data.chart);
  const sonolusLink = $derived(sonolusOpenUrl(`replays/${data.name}`));
  // same split as the level page's "Open via {logo}", so translations can put the logo anywhere
  const watchVia = $derived(t("replay.watchVia").split("{1}").map((s) => s.trim()));
</script>

<Seo title={t("replay.pageTitle", [chart.title])} metaTitle={`Replay of ${chart.title}`} image={ogChartUrl(chart.id)} />

<SiteHeader />

<main class="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href={`/levels/UnCh-${chart.id}`}
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    {t("replay.backToChart")}
  </a>

  <section class="bg-card overflow-hidden rounded-3xl border">
    <div class="relative h-28 sm:h-36">
      {#if backgroundUrl(chart)}
        <div class="absolute inset-0 bg-cover bg-center" style={`background-image:url(${backgroundUrl(chart)})`}></div>
      {:else}
        <div class="from-primary/30 to-card absolute inset-0 bg-linear-to-br"></div>
      {/if}
      <div class="from-card via-card/40 absolute inset-0 bg-linear-to-t to-transparent"></div>
    </div>

    <div class="relative -mt-12 flex flex-col gap-4 px-4 pb-5 sm:-mt-14 sm:flex-row sm:items-end sm:gap-5 sm:px-7 sm:pb-6">
      <CoverArt
        id={chart.id}
        title={chart.title}
        src={coverUrl(chart)}
        rounded="rounded-2xl"
        class="ring-card size-24 shrink-0 shadow-lg ring-4 sm:size-28"
      />
      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-xs font-semibold">{t("replay.replay")}</span>
          <LevelBadge level={chart.rating} size="sm" />
        </div>
        <h1 class="font-heading truncate text-2xl leading-tight font-bold tracking-tight">
          <a href={`/levels/UnCh-${chart.id}`} class="hover:underline"><FormattedText text={chart.title} /></a>
        </h1>
        <p class="text-muted-foreground truncate text-sm"><FormattedText text={chart.artists} /></p>
      </div>
      <a
        href={sonolusLink}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white! shadow-sm transition-opacity hover:opacity-90"
        style="background-color: #000020"
      >
        {#if watchVia[0]}<span>{watchVia[0]}</span>{/if}
        <img src="https://sonolus.com/logo.png" alt="Sonolus" width="1775" height="360" class="h-4 w-auto" />
        {#if watchVia[1]}<span>{watchVia[1]}</span>{/if}
      </a>
    </div>
  </section>

  <AdSlot />

  {#await data.score}
    <div class="bg-card h-48 animate-pulse rounded-3xl border"></div>
  {:then score}
    {#if score}
      <section class="bg-card space-y-5 rounded-3xl border p-5 sm:p-7">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <a href={`/users/${score.account.sonolus_handle}`} class="group flex min-w-0 items-center gap-3">
            <img src={profileUrl(score.account)} alt="" class="size-11 shrink-0 rounded-full object-cover" />
            <div class="min-w-0">
              <p class="text-muted-foreground text-xs">{t("replay.playedBy")}</p>
              <p class="flex min-w-0 items-center gap-1.5 font-semibold">
                <span class="truncate group-hover:underline">{score.account.sonolus_username}</span>
                <AccountBadges badges={score.account.badges} class="size-4" />
                <span class="text-muted-foreground shrink-0 text-xs font-normal tabular-nums">#{score.account.sonolus_handle}</span>
              </p>
            </div>
          </a>
          <p class="text-muted-foreground text-sm">
            <time datetime={score.created_at}>{t("replay.createdAt", [relativeTime(score.created_at)])}</time>
          </p>
        </div>

        <div class="flex flex-wrap items-end gap-x-8 gap-y-3">
          <GradeLabel grade={score.grade} class="text-2xl" />
          <div>
            <p class="text-muted-foreground text-xs">{t("leaderboard.score")}</p>
            <p class="font-heading text-4xl font-bold tabular-nums">{grouped(score.arcade_score)}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs">{t("leaderboard.accuracy")}</p>
            <p class="font-heading text-2xl font-bold tabular-nums">{formatAccuracy(score.accuracy_score)}</p>
          </div>
        </div>

        <dl class="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-6">
          <div class="bg-card px-4 py-2.5">
            <dt class="text-xs text-fuchsia-600 dark:text-fuchsia-400">{t("leaderboard.perfectJudge")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{grouped(score.nperfect)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-xs text-pink-600 dark:text-pink-500">{t("leaderboard.greatJudge")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{grouped(score.ngreat)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-xs text-sky-600 dark:text-sky-400">{t("leaderboard.goodJudge")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{grouped(score.ngood)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("leaderboard.missJudge")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">{grouped(score.nmiss)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("leaderboard.speed")}</dt>
            <dd class="font-heading text-lg font-bold tabular-nums">×{score.speed.toFixed(1)}</dd>
          </div>
          <div class="bg-card px-4 py-2.5">
            <dt class="text-muted-foreground text-xs">{t("replay.engine")}</dt>
            <dd class="truncate text-sm font-semibold leading-7">{score.engine}</dd>
          </div>
        </dl>
      </section>
    {:else}
      <p class="text-muted-foreground rounded-2xl border px-4 py-6 text-sm">{t("replay.scoreNotFound")}</p>
    {/if}
  {/await}
</main>

<SiteFooter />
