<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { cn } from "$lib/utils.js";
  import { invalidateAll } from "$app/navigation";
  import { session } from "$lib/state/session.svelte";
  import { accountAction, type AccountAction } from "$lib/data/staff.js";
  import type { Account } from "$lib/data/index.js";
  import Modal from "./modal.svelte";
  import Button from "./button.svelte";
  import OptionsMenu, { menuRow } from "./options-menu.svelte";
  import { RiForbidLine, RiShieldUserLine, RiShieldStarLine } from "$lib/icons.js";

  // Account moderation on a profile page, behind its options (⋯). It checks the signed-in role itself:
  // only admins see it, and never on their own page. The API checks again on every action, since each
  // one is sent with the admin's own session. Every action asks once before it runs.
  let { account, class: className }: { account: Account; class?: string } = $props();

  const allowed = $derived(session.user?.role === "Admin" && session.user.handle !== account.sonolus_handle);

  type Item = { action: AccountAction; key: string; danger?: boolean; icon: typeof RiForbidLine };
  const actions = $derived<Item[]>([
    account.banned ? { action: "unban", key: "staff.unban", icon: RiForbidLine } : { action: "ban", key: "staff.ban", danger: true, icon: RiForbidLine },
    account.mod ? { action: "unmod", key: "staff.unmod", icon: RiShieldUserLine } : { action: "makeMod", key: "staff.makeMod", icon: RiShieldUserLine },
    account.admin ? { action: "unadmin", key: "staff.unadmin", danger: true, icon: RiShieldStarLine } : { action: "makeAdmin", key: "staff.makeAdmin", icon: RiShieldStarLine },
  ]);

  let pending = $state<Item | null>(null);
  let confirmOpen = $state(false);
  let busy = $state(false);
  let message = $state<{ ok: boolean; text: string } | null>(null);

  async function confirm() {
    const key = session.sessionKey;
    if (!key || !pending || !allowed) return;
    busy = true;
    const res = await accountAction(key, account.sonolus_id, pending.action);
    busy = false;
    confirmOpen = false;
    message = res.ok ? { ok: true, text: t("generic.saved") } : { ok: false, text: res.error };
    if (res.ok) await invalidateAll();
  }
</script>

{#if allowed}
  <OptionsMenu label={t("staff.title")} class={cn("hover:bg-muted size-11 rounded-xl border", className)}>
    {#snippet items({ big, close })}
      <p class="text-muted-foreground px-3 pt-1 pb-1 text-xs font-medium">{t("staff.title")}</p>
      {#each actions as a (a.action)}
        <button
          type="button"
          role="menuitem"
          onclick={() => {
            close();
            message = null;
            pending = a;
            confirmOpen = true;
          }}
          class={menuRow(big, a.danger)}
        >
          <a.icon class="size-4 shrink-0" />{t(a.key)}
        </button>
      {/each}
    {/snippet}
  </OptionsMenu>

  <Modal bind:open={confirmOpen}>
    <div role="alertdialog" aria-labelledby="account-confirm-title" class="space-y-4 p-1">
      <h2 id="account-confirm-title" class="text-lg font-semibold">
        {pending ? t("staff.confirm", [t(pending.key), account.sonolus_username]) : ""}
      </h2>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" class="rounded-full" onclick={() => (confirmOpen = false)}>{t("generic.cancel")}</Button>
        <Button
          type="button"
          disabled={busy}
          onclick={confirm}
          class={cn("rounded-full", pending?.danger && "border-rose-600 bg-rose-600 text-white hover:bg-rose-700")}
        >
          {pending ? t(pending.key) : ""}
        </Button>
      </div>
    </div>
  </Modal>
{/if}

{#if message}
  <p class={cn("w-full text-xs sm:w-auto", message.ok ? "text-emerald-500" : "text-rose-500")} role="status">{message.text}</p>
{/if}
