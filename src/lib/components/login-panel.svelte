<script lang="ts">
  import type { Component } from "svelte";
  import { t } from "$lib/i18n.svelte.js";
  import Button from "./button.svelte";
  import { session } from "$lib/state/session.svelte";
  import { RiLoginBoxLine } from "$lib/icons.js";

  // one entry per way to log in, so Google or Discord can be added later as one more entry
  const providers: { id: string; label: () => string; icon: Component<{ class?: string }>; start: () => void }[] = [
    { id: "sonolus", label: () => t("login.logInWithSonolus"), icon: RiLoginBoxLine, start: () => session.login() },
  ];
</script>

<main class="mx-auto flex min-h-[55vh] max-w-sm flex-col items-center justify-center px-4 py-20">
  <div class="bg-card ring-border/70 w-full space-y-5 rounded-2xl border p-6 text-center ring-1">
    <h1 class="font-heading text-xl font-semibold tracking-tight">{t("generic.logIn")}</h1>
    <div class="space-y-2">
      {#each providers as provider (provider.id)}
        <Button onclick={provider.start} disabled={session.pending} class="w-full rounded-full">
          <provider.icon class="size-4" />
          {provider.label()}
        </Button>
      {/each}
    </div>
  </div>
</main>
