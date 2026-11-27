<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { profileUrl, creatorPath, DEFAULT_AVATAR, type Account } from "$lib/data/index.js";
  import FormattedText from "./formatted-text.svelte";
  import { cn } from "$lib/utils.js";

  // Who charted it: their picture, "Charted by", and their name linking to their page. The account
  // may still be loading; the name comes from the chart, so it shows at once.
  let {
    name,
    handle,
    account,
    class: className,
  }: { name: string; handle: number; account: Promise<Account | null> | Account | null; class?: string } = $props();
</script>

<a href={creatorPath(handle)} class={cn("group flex w-fit max-w-full items-center gap-3", className)}>
  {#await account}
    <span class="bg-muted size-9 shrink-0 animate-pulse rounded-full"></span>
  {:then loaded}
    <img src={loaded ? profileUrl(loaded) : DEFAULT_AVATAR} alt="" class="size-9 shrink-0 rounded-full object-cover" />
  {/await}
  <span class="min-w-0 leading-tight">
    <span class="text-muted-foreground block text-xs">{t("levelDetail.chartedByLabel")}</span>
    <span class="text-accent mt-0.5 block truncate text-sm font-bold group-hover:underline"><FormattedText text={name} /></span>
  </span>
</a>
