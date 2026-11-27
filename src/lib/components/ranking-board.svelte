<script lang="ts">
  import GradeLabel from "./grade-label.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import type { ScoreEntry, LeaderboardType } from "$lib/data/index.js";
  import { grouped, formatAccuracy, profileUrl, relativeTime, replayName } from "$lib/data/index.js";
  import { RiPlayFill, RiArrowDownSLine } from "$lib/icons.js";
  import { session } from "$lib/state/session.svelte";
  import { cn } from "$lib/utils.js";

  // The ranking as a table: labels once in the header, numbers lined up in columns so plays can be
  // compared at a glance. Narrow spaces get compact rows that open for the judgements and the replay.
  let { entries, type, startRank = 1 }: { entries: ScoreEntry[]; type: LeaderboardType; startRank?: number } = $props();

  let openId = $state<number | null>(null);

  const isMine = (e: ScoreEntry) => !!session.user && e.account.sonolus_handle === session.user.handle;
  const replayHref = (e: ScoreEntry) => (e.replay_data_hash ? `/replays/${replayName(e.chart_id, e.id)}` : null);

  // the column this board is ranked by is the one that's emphasised
  const by = $derived(
    type === "accuracy_score" ? "accuracy" : type === "perfect" ? "perfect" : type === "least_misses" ? "miss" : type === "least_combo_breaks" ? "breaks" : "score",
  );
  const RANK_TONE = ["text-amber-400", "text-slate-300", "text-orange-400"];
  const COLS = "grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_4.5rem_2.75rem_1.75rem] @4xl:grid-cols-[2rem_minmax(0,1fr)_7rem_6rem_4.5rem_3.25rem_3rem_3rem_3rem_2.75rem_1.75rem]";
  const dim = (n: number) => (n === 0 ? "text-muted-foreground/45" : "");
</script>

<!-- sized by the space the board gets, not the screen: one aligned table when there's room for it,
     the judgement columns once there's room for those too, compact rows otherwise -->
<div class="@container">
<div class="hidden @3xl:block" role="table" aria-label={t("levelDetail.leaderboard")}>
  <div role="row" class={cn("text-muted-foreground grid items-center gap-x-3 border-b pb-2 text-[11px] font-medium", COLS)}>
    <span role="columnheader" class="text-center">#</span>
    <span role="columnheader">{t("leaderboard.player")}</span>
    <span role="columnheader">{t("leaderboard.result")}</span>
    <span role="columnheader" class={cn("text-right", by === "score" && "text-foreground")}>{t("leaderboard.score")}</span>
    <span role="columnheader" class={cn("text-right", by === "accuracy" && "text-foreground")}>{t("leaderboard.accuracy")}</span>
    <span role="columnheader" class={cn("hidden text-right @4xl:block text-fuchsia-400", by === "perfect" && "font-semibold")}>{t("leaderboard.perfectJudge")}</span>
    <span role="columnheader" class="hidden text-right text-pink-400 @4xl:block">{t("leaderboard.greatJudge")}</span>
    <span role="columnheader" class={cn("hidden text-right @4xl:block text-sky-400", by === "breaks" && "font-semibold")}>{t("leaderboard.goodJudge")}</span>
    <span role="columnheader" class={cn("hidden text-right @4xl:block", by === "miss" || by === "breaks" ? "text-foreground font-semibold" : "")}>{t("leaderboard.missJudge")}</span>
    <span role="columnheader" class="text-right">{t("leaderboard.speed")}</span>
    <span role="columnheader"><span class="sr-only">{t("replay.watchReplay")}</span></span>
  </div>

  {#each entries as e, i (e.id)}
    {@const rank = startRank + i}
    <div
      role="row"
      class={cn(
        "grid items-center gap-x-3 border-b border-border/50 text-sm tabular-nums last:border-0",
        COLS,
        rank === 1 ? "py-3.5" : "py-2.5",
        isMine(e) && "bg-primary/8",
      )}
    >
      <span role="cell" class={cn("font-heading text-center font-bold", rank === 1 ? "text-lg" : "text-sm", RANK_TONE[rank - 1] ?? "text-muted-foreground")}>{rank}</span>
      <a role="cell" href={`/creators/${e.account.sonolus_handle}`} class="group flex min-w-0 items-center gap-2.5">
        <img src={profileUrl(e.account)} alt="" loading="lazy" class={cn("shrink-0 rounded-full object-cover opacity-90", rank === 1 ? "size-8" : "size-6")} />
        <span class={cn("truncate font-medium group-hover:underline", rank === 1 && "font-semibold")}>{e.account.sonolus_username}</span>
        <span class="text-muted-foreground hidden shrink-0 text-[11px] @4xl:inline">{relativeTime(e.created_at)}</span>
      </a>
      <span role="cell"><GradeLabel grade={e.grade} class={rank === 1 ? "text-[15px]" : "text-[13px]"} /></span>
      <span role="cell" class={cn("font-heading text-right", by === "score" ? "font-bold" : "text-muted-foreground", rank === 1 && "text-base")}>{grouped(e.arcade_score)}</span>
      <span role="cell" class={cn("text-right", by === "accuracy" ? "font-bold" : "text-muted-foreground")}>{formatAccuracy(e.accuracy_score)}</span>
      <span role="cell" class={cn("hidden text-right @4xl:block", dim(e.nperfect), by === "perfect" && "font-bold")}>{grouped(e.nperfect)}</span>
      <span role="cell" class={cn("hidden text-right @4xl:block", dim(e.ngreat))}>{grouped(e.ngreat)}</span>
      <span role="cell" class={cn("hidden text-right @4xl:block", dim(e.ngood))}>{grouped(e.ngood)}</span>
      <span role="cell" class={cn("hidden text-right @4xl:block", dim(e.nmiss), by === "miss" && "font-bold")}>{grouped(e.nmiss)}</span>
      <span role="cell" class="text-muted-foreground text-right">×{e.speed.toFixed(1)}</span>
      <span role="cell" class="flex justify-end">
        {#if replayHref(e)}
          <a
            href={replayHref(e)}
            aria-label={t("replay.watchReplay")}
            title={t("replay.watchReplay")}
            class="text-muted-foreground hover:text-primary hover:bg-primary/10 grid size-7 place-items-center rounded-full transition-colors"
          >
            <RiPlayFill class="size-4" />
          </a>
        {/if}
      </span>
    </div>
  {/each}
</div>

<!-- phones: compact rows; each opens for its details -->
<ol class="divide-border/50 divide-y @3xl:hidden">
  {#each entries as e, i (e.id)}
    {@const rank = startRank + i}
    {@const open = openId === e.id}
    <li class={cn(isMine(e) && "bg-primary/8")}>
      <button type="button" onclick={() => (openId = open ? null : e.id)} aria-expanded={open} class="flex w-full items-center gap-3 py-2.5 text-left">
        <span class={cn("font-heading w-6 shrink-0 text-center text-sm font-bold tabular-nums", RANK_TONE[rank - 1] ?? "text-muted-foreground")}>{rank}</span>
        <img src={profileUrl(e.account)} alt="" loading="lazy" class="size-7 shrink-0 rounded-full object-cover opacity-90" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{e.account.sonolus_username}</span>
          <GradeLabel grade={e.grade} class="text-[11px]" />
        </span>
        <span class="font-heading shrink-0 text-sm font-bold tabular-nums">
          {by === "accuracy" ? formatAccuracy(e.accuracy_score) : by === "perfect" ? grouped(e.nperfect) : by === "miss" ? grouped(e.nmiss) : by === "breaks" ? grouped(e.ngood + e.nmiss) : grouped(e.arcade_score)}
        </span>
        <RiArrowDownSLine class={cn("text-muted-foreground size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {#if open}
        <div class="space-y-2.5 pb-3 pl-9">
          <dl class="grid grid-cols-4 gap-2 text-center text-xs tabular-nums">
            {#each [
              { label: t("leaderboard.perfectJudge"), n: e.nperfect, tone: "text-fuchsia-400" },
              { label: t("leaderboard.greatJudge"), n: e.ngreat, tone: "text-pink-400" },
              { label: t("leaderboard.goodJudge"), n: e.ngood, tone: "text-sky-400" },
              { label: t("leaderboard.missJudge"), n: e.nmiss, tone: "text-muted-foreground" },
            ] as j (j.label)}
              <div class="bg-muted/50 rounded-lg py-1.5">
                <dt class={cn("text-[10px]", j.tone)}>{j.label}</dt>
                <dd class={cn("font-semibold", dim(j.n))}>{grouped(j.n)}</dd>
              </div>
            {/each}
          </dl>
          <p class="text-muted-foreground text-xs tabular-nums">
            {grouped(e.arcade_score)} · {formatAccuracy(e.accuracy_score)} · ×{e.speed.toFixed(1)} · {relativeTime(e.created_at)}
          </p>
          {#if replayHref(e)}
            <a href={replayHref(e)} class="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
              <RiPlayFill class="size-4" />{t("replay.watchReplay")}
            </a>
          {/if}
        </div>
      {/if}
    </li>
  {/each}
</ol>
</div>
