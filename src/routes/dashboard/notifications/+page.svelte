<script lang="ts">
  import Seo from "$lib/components/seo.svelte";
  import { t } from "$lib/i18n.svelte.js";
  import { RiArrowLeftLine, RiNotification3Line } from "$lib/icons.js";

  // TODO: load with fetchNotifications() from $lib/data/notifications and render the list
</script>

<Seo title={t("generic.notifications")} metaTitle="Notifications" />

<main class="mx-auto flex min-h-[calc(100svh-12rem)] max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
  <a
    href="/dashboard"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 self-start text-sm transition-colors"
  >
    <RiArrowLeftLine
      class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    />
    {t("generic.dashboard")}
  </a>

  <h1 class="font-heading text-2xl font-bold tracking-tight">{t("generic.notifications")}</h1>

  <section class="bg-card flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-16 text-center">
    <RiNotification3Line class="text-muted-foreground size-8" />
    <span
      class="rounded border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300"
      >{t("generic.workInProgress")}</span
    >
    <p class="text-muted-foreground max-w-sm text-sm">{t("generic.workInProgressBody")}</p>
  </section>
</main>
