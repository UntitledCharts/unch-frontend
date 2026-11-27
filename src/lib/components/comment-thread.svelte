<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import type { Comment } from "$lib/data/index.js";
  import { relativeTime, profileUrl } from "$lib/data/index.js";
  import { session } from "$lib/state/session.svelte";
  import { deleteComment } from "$lib/data/staff.js";
  import CoverArt from "./cover-art.svelte";
  import FormattedText from "./formatted-text.svelte";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import OptionsMenu, { menuRow } from "./options-menu.svelte";
  import { cn } from "$lib/utils.js";
  import { RiDeleteBinLine } from "$lib/icons.js";

  // Comments on a chart: a plain list. The charter's own are marked and long ones fold. Each comment's
  // options (⋯) appear only for its writer and for mods and admins; that's decided here from the
  // signed-in session, not by the page, and the API checks the same rule when a delete is sent.
  let {
    comments = $bindable(),
    chartId,
    charterHandle,
    ondeleted,
  }: { comments: Comment[]; chartId: string; charterHandle: number; ondeleted?: () => void } = $props();

  const isStaff = $derived(session.user?.role === "Admin" || session.user?.role === "Mod");
  const canManage = (c: Comment) => isStaff || (!!session.user && c.account.sonolus_handle === session.user.handle);

  const LONG = 280;
  let unfolded = $state(new Set<number>());

  let pending = $state<Comment | null>(null);
  let confirmOpen = $state(false);
  let busy = $state(false);
  let error = $state<string | null>(null);

  async function remove() {
    const key = session.sessionKey;
    if (!key || !pending || !canManage(pending)) return;
    busy = true;
    const res = await deleteComment(key, chartId, pending.id);
    busy = false;
    if (res.ok) {
      const gone = pending.id;
      comments = comments.filter((c) => c.id !== gone);
      confirmOpen = false;
      ondeleted?.();
    } else {
      error = res.error;
    }
  }
</script>

<ul class="divide-border/60 divide-y">
  {#each comments as c (c.id)}
    {@const byCharter = c.account.sonolus_handle === charterHandle}
    {@const folded = c.content.length > LONG && !unfolded.has(c.id)}
    <li class="group relative flex gap-3 py-3.5 first:pt-1">
      <a href={`/creators/${c.account.sonolus_handle}`} class="shrink-0" aria-label={c.account.sonolus_username}>
        <CoverArt id={c.account.sonolus_id} title={c.account.sonolus_username} src={profileUrl(c.account)} rounded="rounded-full" class="size-9 text-sm" />
      </a>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 pr-8">
          <a href={`/creators/${c.account.sonolus_handle}`} class="text-sm font-semibold hover:underline">{c.account.sonolus_username}</a>
          {#if byCharter}
            <span class="text-accent border-accent/40 bg-accent/10 rounded border px-1 py-px text-[10px] font-bold">{t("levelDetail.charterBadge")}</span>
          {/if}
          {#if c.account.admin}
            <span class="rounded border border-rose-400/40 bg-rose-400/15 px-1 py-px text-[10px] font-bold text-rose-600 dark:text-rose-300">{t("userProfile.admin")}</span>
          {:else if c.account.mod}
            <span class="rounded border border-teal-400/40 bg-teal-400/15 px-1 py-px text-[10px] font-bold text-teal-700 dark:text-teal-300">{t("userProfile.mod")}</span>
          {/if}
          <time class="text-muted-foreground/80 text-xs" datetime={new Date(c.created_at).toISOString()}>{relativeTime(c.created_at)}</time>
        </div>
        <p class={cn("text-foreground/90 mt-1 text-sm leading-relaxed wrap-break-word whitespace-pre-line", folded && "line-clamp-4")}>
          <FormattedText text={c.content} linkify />
        </p>
        {#if folded}
          <button type="button" onclick={() => (unfolded = new Set(unfolded).add(c.id))} class="text-muted-foreground hover:text-foreground mt-1 text-xs font-semibold">
            {t("levelDetail.readMore")}
          </button>
        {/if}
      </div>
      {#if canManage(c)}
        <OptionsMenu label={t("levelDetail.commentOptions")} iconClass="size-4" class="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-2.5 right-0 size-8">
          {#snippet items({ big, close })}
            <button
              type="button"
              role="menuitem"
              onclick={() => {
                close();
                pending = c;
                error = null;
                confirmOpen = true;
              }}
              class={menuRow(big, true)}
            >
              <RiDeleteBinLine class="size-4 shrink-0" />{t("levelDetail.deleteComment")}
            </button>
          {/snippet}
        </OptionsMenu>
      {/if}
    </li>
  {/each}
</ul>

<Modal bind:open={confirmOpen}>
  <div role="alertdialog" aria-labelledby="del-comment-title" class="space-y-4 p-1">
    <div class="space-y-1.5">
      <h2 id="del-comment-title" class="text-lg font-semibold">{t("levelDetail.deleteCommentTitle")}</h2>
      {#if pending}
        <p class="text-muted-foreground line-clamp-3 text-sm">“{pending.content}” — {pending.account.sonolus_username}</p>
      {/if}
      {#if error}<p class="text-sm text-rose-500">{error}</p>{/if}
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (confirmOpen = false)}>{t("oauth.cancel")}</Button>
      <Button type="button" disabled={busy} onclick={remove} class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700">
        <RiDeleteBinLine class="size-4" />{t("levelDetail.deleteComment")}
      </Button>
    </div>
  </div>
</Modal>
