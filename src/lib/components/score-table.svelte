<script lang="ts">
  import GradeLabel from "./grade-label.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import type { ScoreEntry } from "$lib/data/index.js";
  import { grouped, formatAccuracy, profileUrl, relativeTime, replayName } from "$lib/data/index.js";
  import { RiPlayFill } from "$lib/icons.js";
  import { session } from "$lib/state/session.svelte";
  import { cn } from "$lib/utils.js";

  // A plain score table: one row per play, the columns a player compares.
  let { entries, startRank = 1 }: { entries: ScoreEntry[]; startRank?: number } = $props();

  const isMine = (e: ScoreEntry) => !!session.user && e.account.sonolus_handle === session.user.handle;
  const replayHref = (e: ScoreEntry) => (e.replay_data_hash ? `/replays/${replayName(e.chart_id, e.id)}` : null);
  const rankTone = (r: number) => (r === 1 ? "text-amber-400" : r === 2 ? "text-slate-300" : r === 3 ? "text-orange-400" : "text-muted-foreground");
</script>

<div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
  <table class="w-full border-separate border-spacing-y-0.5 text-sm">
    <thead>
      <tr class="text-muted-foreground text-left text-xs [&>th]:px-2.5 [&>th]:pb-2 [&>th]:font-medium [&>th]:whitespace-nowrap">
        <th class="w-10 text-center">#</th>
        <th>{t("leaderboard.result")}</th>
        <th>{t("leaderboard.score")}</th>
        <th class="hidden sm:table-cell">{t("leaderboard.accuracy")}</th>
        <th>{t("leaderboard.player")}</th>
        <th class="hidden md:table-cell">{t("leaderboard.perfectJudge")}</th>
        <th class="hidden md:table-cell">{t("leaderboard.greatJudge")}</th>
        <th class="hidden md:table-cell">{t("leaderboard.goodJudge")}</th>
        <th class="hidden md:table-cell">{t("leaderboard.missJudge")}</th>
        <th class="hidden sm:table-cell">{t("leaderboard.speed")}</th>
        <th class="hidden lg:table-cell">{t("leaderboard.played")}</th>
        <th class="w-10"><span class="sr-only">{t("replay.watchReplay")}</span></th>
      </tr>
    </thead>
    <tbody>
      {#each entries as e, i (e.id)}
        {@const rank = startRank + i}
        <tr
          class={cn(
            "[&>td]:px-2.5 [&>td]:py-2 [&>td]:whitespace-nowrap [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl",
            isMine(e) ? "[&>td]:bg-primary/12" : "hover:[&>td]:bg-muted/50",
          )}
        >
          <td class={cn("font-heading text-center text-sm font-semibold tabular-nums", rankTone(rank))}>{rank}</td>
          <td><GradeLabel grade={e.grade} class="text-[13px]" /></td>
          <td class="font-heading font-semibold tabular-nums">{grouped(e.arcade_score)}</td>
          <td class="hidden tabular-nums sm:table-cell">{formatAccuracy(e.accuracy_score)}</td>
          <td class="max-w-0 w-full">
            <a href={`/creators/${e.account.sonolus_handle}`} class="flex min-w-0 items-center gap-2.5 hover:underline">
              <img src={profileUrl(e.account)} alt="" loading="lazy" class="size-7 shrink-0 rounded-full object-cover" />
              <span class="truncate font-medium">{e.account.sonolus_username}</span>
            </a>
          </td>
          <td class="hidden tabular-nums md:table-cell">{grouped(e.nperfect)}</td>
          <td class={cn("hidden tabular-nums md:table-cell", e.ngreat === 0 && "text-muted-foreground/60")}>{grouped(e.ngreat)}</td>
          <td class={cn("hidden tabular-nums md:table-cell", e.ngood === 0 && "text-muted-foreground/60")}>{grouped(e.ngood)}</td>
          <td class={cn("hidden tabular-nums md:table-cell", e.nmiss === 0 && "text-muted-foreground/60")}>{grouped(e.nmiss)}</td>
          <td class="text-muted-foreground hidden tabular-nums sm:table-cell">×{e.speed.toFixed(1)}</td>
          <td class="text-muted-foreground hidden lg:table-cell">{relativeTime(e.created_at)}</td>
          <td class="text-right">
            {#if replayHref(e)}
              <a
                href={replayHref(e)}
                aria-label={t("replay.watchReplay")}
                title={t("replay.watchReplay")}
                class="text-primary hover:bg-primary hover:text-primary-foreground bg-primary/12 inline-grid size-8 place-items-center rounded-full transition-colors"
              >
                <RiPlayFill class="size-4 translate-x-px" />
              </a>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
