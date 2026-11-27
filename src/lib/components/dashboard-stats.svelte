<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { compact, type DashboardStats } from "$lib/data/index.js";
  import { RiBookmarkLine, RiFolder3Line, RiTeamLine, RiTimeLine } from "$lib/icons.js";

  let { stats }: { stats: DashboardStats } = $props();

  const items = $derived([
    { get label() { return t("dashboard.statSaved"); }, value: stats.saved, icon: RiBookmarkLine, tint: "text-rose-400" },
    { get label() { return t("dashboard.statCollections"); }, value: stats.collections, icon: RiFolder3Line, tint: "text-primary" },
    { get label() { return t("dashboard.statCreators"); }, value: stats.creators, icon: RiTeamLine, tint: "text-sky-400" },
    { get label() { return t("dashboard.statPlayed"); }, value: stats.played, icon: RiTimeLine, tint: "text-amber-400" },
  ]);
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
  {#each items as item (item.label)}
    {@const Icon = item.icon}
    <div class="bg-card ring-border/70 rounded-2xl border p-4 ring-1">
      <div class="text-muted-foreground flex items-center gap-2">
        <Icon class="size-4 {item.tint}" />
        <span class="text-xs font-medium">{item.label}</span>
      </div>
      <p class="font-heading mt-2 text-2xl font-bold tabular-nums">{compact(item.value)}</p>
    </div>
  {/each}
</div>
