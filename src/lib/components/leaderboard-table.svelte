<script lang="ts">
  import GradeLabel from "./grade-label.svelte";
  import AccountBadges from "./account-badges.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import type { ScoreEntry, LeaderboardType } from "$lib/data/index.js";
  import { grouped, leaderboardMeta, formatAccuracy, profileUrl, relativeTime, replayName } from "$lib/data/index.js";
  import { RiPlayFill } from "$lib/icons.js";
  import { session } from "$lib/state/session.svelte";
  import { cn } from "$lib/utils.js";

  let {
    entries,
    type,
    startRank = 1,
    bg = null,
  }: { entries: ScoreEntry[]; type: LeaderboardType; startRank?: number; bg?: string | null } = $props();

  // the #1 entry gets its own block on the first page; everything else is a row
  const top = $derived(startRank === 1 ? entries[0] : undefined);
  const rows = $derived(top ? entries.slice(1) : entries);
  const rowStart = $derived(top ? startRank + 1 : startRank);

  const myHandle = $derived(session.user?.handle);

  type Col = "score" | "accuracy" | "perfect" | "miss" | "breaks";
  const focus = $derived<Col>(
    type === "accuracy_score"
      ? "accuracy"
      : type === "perfect"
        ? "perfect"
        : type === "least_misses"
          ? "miss"
          : type === "least_combo_breaks"
            ? "breaks"
            : "score",
  );


  const fmt = (n: number) => grouped(n);
  const isMine = (e: ScoreEntry) => myHandle !== undefined && e.account.sonolus_handle === myHandle;
  const replayHref = (e: ScoreEntry) => (e.replay_data_hash ? `/replays/${replayName(e.chart_id, e.id)}` : null);

  // the number this board is ranked by, plus a short label when it isn't the score
  function headline(e: ScoreEntry): { value: string; label?: string } {
    if (focus === "accuracy") return { value: formatAccuracy(e.accuracy_score) };
    if (focus === "perfect") return { value: fmt(e.nperfect), label: t("leaderboard.perfectJudge") };
    if (focus === "miss") return { value: fmt(e.nmiss), label: t("leaderboard.missJudge") };
    if (focus === "breaks") return { value: fmt(e.ngood + e.nmiss), label: `${t("leaderboard.goodJudge")}+${t("leaderboard.missJudge")}` };
    return { value: fmt(e.arcade_score) };
  }
</script>


{#snippet judges(e: ScoreEntry, big: boolean)}
  <dl class={cn("flex flex-wrap gap-x-4 gap-y-1 tabular-nums", big ? "text-sm" : "text-xs")}>
    {#each [
      { label: t("leaderboard.perfectJudge"), n: e.nperfect, tone: "text-fuchsia-500 dark:text-fuchsia-400" },
      { label: t("leaderboard.greatJudge"), n: e.ngreat, tone: "text-pink-500 dark:text-pink-400" },
      { label: t("leaderboard.goodJudge"), n: e.ngood, tone: "text-sky-600 dark:text-sky-400" },
      { label: t("leaderboard.missJudge"), n: e.nmiss, tone: "text-muted-foreground" },
    ] as j (j.label)}
      <div class="flex items-baseline gap-1">
        <dt class={cn("font-medium", j.tone)}>{j.label}</dt>
        <dd class={cn("font-bold", j.n === 0 && "text-muted-foreground/50")}>{fmt(j.n)}</dd>
      </div>
    {/each}
  </dl>
{/snippet}

{#snippet replayButton(e: ScoreEntry)}
  {#if replayHref(e)}
    <a
      href={replayHref(e)}
      aria-label={t("replay.watchReplay")}
      title={t("replay.watchReplay")}
      class="text-primary bg-primary/12 hover:bg-primary hover:text-primary-foreground grid size-9 shrink-0 place-items-center rounded-full transition-colors"
    >
      <RiPlayFill class="size-4 translate-x-px" />
    </a>
  {:else}
    <span class="size-9 shrink-0"></span>
  {/if}
{/snippet}

<div
  class="bg-card clip-rounded relative isolate overflow-hidden rounded-3xl p-2 sm:p-3"
  aria-label={t("leaderboard.ariaLabel", [leaderboardMeta[type].label])}
>
  {#if bg}
    <span
      class="absolute -inset-1/4 -z-10 bg-cover bg-center opacity-10 blur-3xl"
      style="background-image: url({bg})"
    ></span>
  {/if}

  {#if top}
    {@const head = headline(top)}
    <section
      class={cn("bg-background/60 flex flex-col gap-4 rounded-2xl p-4 sm:p-5", isMine(top) && "ring-primary/60 ring-2")}
    >
      <div class="flex items-center gap-3 sm:gap-4">
        <img src={profileUrl(top.account)} alt="" class="size-11 shrink-0 rounded-full object-cover sm:size-12" />
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
            <span class="font-heading">#1</span>
            {t("leaderboard.topScore")}
          </p>
          <div class="flex min-w-0 items-center gap-1.5">
            <a href={`/users/${top.account.sonolus_handle}`} class="truncate font-bold hover:underline">{top.account.sonolus_username}</a>
            <AccountBadges badges={top.account.badges} class="size-4" />
            {#if isMine(top)}<span class="bg-primary text-primary-foreground shrink-0 rounded px-1.5 text-[10px] font-bold">{t("leaderboard.you")}</span>{/if}
          </div>
          <p class="text-muted-foreground truncate text-xs">#{top.account.sonolus_handle} · {relativeTime(top.created_at)}</p>
        </div>
        {#if replayHref(top)}
          <a
            href={replayHref(top)}
            class="bg-primary text-primary-foreground hidden h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-[filter] hover:brightness-110 sm:inline-flex"
          >
            <RiPlayFill class="size-4" />
            {t("replay.watchReplay")}
          </a>
          <span class="sm:hidden">{@render replayButton(top)}</span>
        {/if}
      </div>

      <GradeLabel grade={top.grade} class="text-2xl sm:text-3xl" />
      <div class="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p class="text-muted-foreground text-[11px]">{head.label ?? (focus === "accuracy" ? t("leaderboard.accuracy") : t("leaderboard.score"))}</p>
          <p class="font-heading text-3xl font-semibold tabular-nums sm:text-4xl">{head.value}</p>
        </div>
        <div class="text-muted-foreground pb-1 text-sm tabular-nums">
          {focus === "accuracy" ? fmt(top.arcade_score) : formatAccuracy(top.accuracy_score)} · ×{top.speed.toFixed(1)}
        </div>
      </div>

      {@render judges(top, true)}
    </section>
  {/if}

  {#if rows.length}
    <ol class={cn("space-y-1.5", top && "mt-2")}>
      {#each rows as e, i (e.id)}
        {@const rank = rowStart + i}
        {@const head = headline(e)}
        <li
          class={cn(
            "flex items-center gap-2.5 rounded-2xl px-2.5 py-2 transition-colors sm:gap-3 sm:px-3",
            isMine(e) ? "bg-primary/15" : "bg-background/45 hover:bg-background/75",
          )}
        >
          <span
            class={cn(
              "font-heading w-7 shrink-0 text-center text-sm font-semibold tabular-nums",
              rank === 2 && "text-slate-400",
              rank === 3 && "text-orange-500",
              rank > 3 && "text-muted-foreground",
            )}>{rank}</span
          >
          <img src={profileUrl(e.account)} alt="" class="size-8 shrink-0 rounded-full object-cover" />

          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-1.5">
              <a href={`/users/${e.account.sonolus_handle}`} class="truncate text-sm font-bold hover:underline"
                >{e.account.sonolus_username}</a
              >
              <AccountBadges badges={e.account.badges} class="size-4" />
              <span class="text-muted-foreground hidden shrink-0 text-xs tabular-nums xl:inline">#{e.account.sonolus_handle}</span>
              {#if isMine(e)}
                <span class="bg-primary text-primary-foreground shrink-0 rounded px-1.5 text-[10px] font-bold">{t("leaderboard.you")}</span>
              {/if}
            </div>
            <div class="mt-1 flex items-center gap-4">
              <GradeLabel grade={e.grade} class="shrink-0 text-xs" />
              <div class="hidden md:block">{@render judges(e, false)}</div>
            </div>
          </div>

          <div class="shrink-0 text-right leading-tight tabular-nums">
            <p class="font-heading text-sm font-semibold sm:text-base">
              {head.value}
              {#if head.label}<span class="text-muted-foreground font-sans text-[10px] font-medium">{head.label}</span>{/if}
            </p>
            <p class="text-muted-foreground text-[11px]">
              {focus === "accuracy" ? fmt(e.arcade_score) : formatAccuracy(e.accuracy_score)} · ×{e.speed.toFixed(1)}
              <span class="hidden lg:inline">· {relativeTime(e.created_at)}</span>
            </p>
          </div>

          {@render replayButton(e)}
        </li>
      {/each}
    </ol>
  {/if}
</div>
