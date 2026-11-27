<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";
  import { API_URL } from "$lib/data/index.js";
  import { RiCheckLine, RiDeleteBinLine } from "$lib/icons.js";
  import Modal from "./modal.svelte";

  type Scope = { scope: string; description?: string };
  type AuthorizedApp = {
    client_id: string;
    name: string;
    description?: string;
    scopes: Scope[];
    authorized_at: string;
  };

  let apps = $state<AuthorizedApp[] | null>(null);
  let error = $state<string | null>(null);
  let revoking = $state<string | null>(null);
  let loadedKey = $state("");

  async function loadApps(key: string) {
    error = null;
    apps = null;
    try {
      const res = await fetch(`${API_URL}/api/oauth/authorizations/`, {
        headers: { Authorization: key },
      });
      if (!res.ok) throw new Error("failed");
      apps = await res.json();
    } catch {
      error = t("oauth.loadFailed");
      apps = [];
    }
  }

  let pendingRevoke = $state<{ client_id: string; name: string } | null>(null);
  let revokeOpen = $state(false);

  function askRevoke(app: { client_id: string; name: string }) {
    pendingRevoke = { client_id: app.client_id, name: app.name };
    revokeOpen = true;
  }

  function confirmRevoke() {
    const target = pendingRevoke;
    revokeOpen = false;
    if (target) revoke(target.client_id);
  }

  async function revoke(clientId: string) {
    const key = session.sessionKey;
    if (!key) return;
    revoking = clientId;
    try {
      const res = await fetch(`${API_URL}/api/oauth/authorizations/${clientId}/`, {
        method: "DELETE",
        headers: { Authorization: key },
      });
      if (!res.ok) throw new Error("failed");
      await loadApps(key);
    } catch {
      error = t("oauth.revokeFailed");
    }
    revoking = null;
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  $effect(() => {
    const key = session.sessionKey;
    if (session.loading || !session.isLoggedIn || !key) return;
    if (key === loadedKey) return;
    loadedKey = key;
    loadApps(key);
  });
</script>

<section class="bg-card ring-border/70 space-y-4 rounded-2xl border p-5 ring-1">
  <div class="space-y-0.5">
    <h2 class="font-semibold">{t("oauth.authorizedApps")}</h2>
    <p class="text-muted-foreground text-sm">
      {t("oauth.authorizedSubtitle")}
    </p>
  </div>

  {#if error}
    <p class="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-300">
      {error}
    </p>
  {/if}

  {#if apps === null}
    <div class="grid place-items-center py-10">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  {:else if apps.length === 0}
    <p class="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
      {t("oauth.noApps")}
    </p>
  {:else}
    <ul class="space-y-3">
      {#each apps as a (a.client_id)}
        <li class="ring-border/70 space-y-3 rounded-xl border p-4 ring-1">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h3 class="font-semibold tracking-tight">{a.name}</h3>
              {#if a.description}
                <p class="text-muted-foreground text-sm">{a.description}</p>
              {/if}
            </div>
            <Button
              onclick={() => askRevoke(a)}
              disabled={revoking === a.client_id}
              variant="destructive"
              size="sm"
              class="shrink-0 rounded-full"
            >
              <RiDeleteBinLine class="size-4" />
              {revoking === a.client_id ? t("oauth.revoking2") : t("oauth.revoke2")}
            </Button>
          </div>

          <ul class="space-y-1.5">
            {#each a.scopes as s (s.scope)}
              <li class="bg-muted/40 flex items-start gap-2.5 rounded-lg px-3 py-2">
                <RiCheckLine class="text-primary mt-0.5 size-4 shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-medium">{s.description || s.scope}</p>
                  <code class="text-muted-foreground/70 text-xs">{s.scope}</code>
                </div>
              </li>
            {/each}
          </ul>

          <p class="text-muted-foreground/70 text-xs">{t("oauth.authorizedOn2", [formatDate(a.authorized_at)])}</p>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<Modal bind:open={revokeOpen}>
  <div role="alertdialog" aria-labelledby="revoke-title" aria-describedby="revoke-body" class="space-y-4 p-1">
    <div class="space-y-1.5">
      <h2 id="revoke-title" class="text-lg font-semibold">{t("oauth.revokeTitle", [pendingRevoke?.name ?? ""])}</h2>
      <p id="revoke-body" class="text-muted-foreground text-sm">{t("oauth.revokeBody", [pendingRevoke?.name ?? ""])}</p>
    </div>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" class="rounded-full" onclick={() => (revokeOpen = false)}>{t("oauth.cancel")}</Button>
      <Button type="button" class="rounded-full border-rose-600 bg-rose-600 text-white hover:bg-rose-700" onclick={confirmRevoke}>
        <RiDeleteBinLine class="size-4" />
        {t("oauth.revoke2")}
      </Button>
    </div>
  </div>
</Modal>
