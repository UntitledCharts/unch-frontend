<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { onMount } from "svelte";
  import { session } from "$lib/state/session.svelte";
  import { postComment, type Comment } from "$lib/data/index.js";
  import { DEFAULT_LIMITS, fetchLimits } from "$lib/data/limits.js";
  import { formFailure } from "$lib/data/uploads.js";
  import CoverArt from "./cover-art.svelte";
  import EmojiTextarea from "./emoji-textarea.svelte";
  import Button from "./button.svelte";
  import { cn } from "$lib/utils.js";
  import { RiSendPlaneLine, RiLoginBoxLine } from "$lib/icons.js";

  let { chartId, onposted }: { chartId: string; onposted: (comment: Comment) => void } = $props();

  const user = $derived(session.user);
  let text = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  let max = $state(DEFAULT_LIMITS.text.comment);

  onMount(() => {
    fetchLimits().then((limits) => (max = limits.text.comment));
  });

  const content = $derived(text.trim());
  const canPost = $derived(!!content && text.length <= max && !busy);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const key = session.sessionKey;
    if (!key || !canPost) return;
    busy = true;
    error = null;
    const res = await postComment(key, chartId, content);
    busy = false;
    if (res.ok) {
      text = "";
      onposted(res.comment);
    } else {
      error = formFailure(res);
    }
  }
</script>

{#if session.isLoggedIn && user}
  <form onsubmit={submit} class="flex gap-3">
    <CoverArt id={user.username} title={user.username} src={user.avatar} rounded="rounded-full" class="size-9 shrink-0" />
    <div class="min-w-0 flex-1 space-y-2">
      <label class="block">
        <span class="sr-only">{t("levelDetail.writeComment")}</span>
        <EmojiTextarea
          bind:value={text}
          rows={3}
          maxlength={max}
          placeholder={t("levelDetail.writeComment")}
          class="bg-card focus-visible:ring-ring/50 w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
        />
      </label>
      <div class="flex flex-wrap items-center justify-end gap-3">
        {#if error}<p role="alert" class="mr-auto text-sm font-medium text-rose-500">{error}</p>{/if}
        <span class={cn("text-muted-foreground text-[11px] tabular-nums", text.length > max && "text-rose-500")}>{text.length}/{max}</span>
        <Button type="submit" size="sm" disabled={!canPost} class="rounded-full">
          <RiSendPlaneLine class="size-4" />
          {busy ? t("generic.posting") : t("levelDetail.postComment")}
        </Button>
      </div>
    </div>
  </form>
{:else if !session.loading}
  <div class="bg-muted/30 flex flex-col items-start gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-muted-foreground text-sm">{t("levelDetail.loginToComment")}</p>
    <Button size="sm" variant="outline" class="shrink-0 rounded-full" onclick={() => session.login()}>
      <RiLoginBoxLine class="size-4" />
      {t("generic.logIn")}
    </Button>
  </div>
{/if}
