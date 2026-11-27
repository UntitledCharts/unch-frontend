<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { page } from "$app/state";
  import { cn } from "$lib/utils.js";
  import { session } from "$lib/state/session.svelte";
  import {
    RiHome5Line,
    RiHome5Fill,
    RiCompass3Line,
    RiCompass3Fill,
    RiUpload2Line,
    RiDashboardLine,
    RiDashboardFill,
    RiNotification3Line,
    RiNotification3Fill,
  } from "$lib/icons.js";

  const path = $derived(page.url.pathname);
  const isHome = $derived(path === "/");
  const isBrowse = $derived(path.startsWith("/browse"));
  const isDashboard = $derived(path === "/dashboard");
  const isNotifications = $derived(path.startsWith("/dashboard/notifications"));

  const tab = "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors";
</script>

<nav
  aria-label={t("nav.primary")}
  class="bg-background/85 supports-backdrop-filter:bg-background/70 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
>
  <div class={cn("mx-auto grid h-16 max-w-md", session.isLoggedIn ? "grid-cols-5" : "grid-cols-2")}>
    <a href="/" aria-current={isHome ? "page" : undefined} class={cn(tab, isHome ? "text-primary" : "text-muted-foreground")}>
      {#if isHome}<RiHome5Fill class="size-6" />{:else}<RiHome5Line class="size-6" />{/if}
      {t("nav.home")}
    </a>

    <a href="/browse" aria-current={isBrowse ? "page" : undefined} class={cn(tab, isBrowse ? "text-primary" : "text-muted-foreground")}>
      {#if isBrowse}<RiCompass3Fill class="size-6" />{:else}<RiCompass3Line class="size-6" />{/if}
      {t("nav.browse")}
    </a>

    <!-- upload, dashboard and notifications need an account; signed-out visitors log in from the header -->
    {#if session.isLoggedIn}
      <a href="/dashboard/upload" aria-label={t("nav.upload")} class="flex flex-col items-center justify-center">
        <span
          class="bg-primary text-primary-foreground! -mt-5 grid size-13 place-items-center rounded-full shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
        >
          <RiUpload2Line class="size-6" />
        </span>
        <span class="text-muted-foreground -mt-0.5 text-[10px] font-medium">{t("nav.upload")}</span>
      </a>

      <a href="/dashboard" aria-current={isDashboard ? "page" : undefined} class={cn(tab, isDashboard ? "text-primary" : "text-muted-foreground")}>
        {#if isDashboard}<RiDashboardFill class="size-6" />{:else}<RiDashboardLine class="size-6" />{/if}
        {t("nav.dashboard")}
      </a>

      <a
        href="/dashboard/notifications"
        aria-current={isNotifications ? "page" : undefined}
        class={cn(tab, isNotifications ? "text-primary" : "text-muted-foreground")}
      >
        {#if isNotifications}<RiNotification3Fill class="size-6" />{:else}<RiNotification3Line class="size-6" />{/if}
        {t("nav.notifications")}
      </a>
    {/if}
  </div>
</nav>
