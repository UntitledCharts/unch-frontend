<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import Button from "$lib/components/button.svelte";
  import UserProfileNav from "$lib/components/user-profile-nav.svelte";
  import { cn } from "$lib/utils.js";
  import { page } from "$app/state";
  import { toggleMode } from "mode-watcher";
  import { RiSunLine, RiMoonLine } from "$lib/icons.js";

  import { session } from "$lib/state/session.svelte";

  const links = $derived([
    { key: "generic.home", href: "/" },
    { key: "generic.browse", href: "/browse" },
    ...(session.isLoggedIn ? [{ key: "generic.dashboard", href: "/dashboard" }] : []),
  ]);

  function isActive(href: string) {
    return href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href);
  }
</script>

<!-- the fade behind the pill covers the gap above it, so scrolled content doesn't show through there -->
<header
  class="before:from-background before:via-background/80 sticky top-4 z-40 w-full px-4 before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:-z-10 before:h-12 before:bg-linear-to-b before:to-transparent"
>
  <div
    class="bg-background/70 supports-backdrop-filter:bg-background/55 mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-full border px-3 pl-5 shadow-lg backdrop-blur-xl sm:px-4 sm:pl-6"
  >
    <a href="/" class="flex items-center gap-2.5" aria-label={t("nav.homeAria")}>
      <img
        src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png"
        alt=""
        class="size-6 shrink-0"
        aria-hidden="true"
      />
      <span class="font-heading text-sm font-semibold tracking-tight">UntitledCharts</span>
    </a>

    <nav class="hidden items-center gap-7 md:flex" aria-label={t("nav.primary")}>
      {#each links as link (link.href)}
        <a
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          class={cn(
            "after:bg-primary relative py-1 text-sm transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:transition-transform motion-reduce:after:transition-none",
            isActive(link.href)
              ? "text-foreground after:scale-x-100"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(link.key)}
        </a>
      {/each}
    </nav>

    <div class="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onclick={toggleMode}
        aria-label={t("nav.toggleTheme")}
        class="text-muted-foreground hover:text-foreground rounded-full"
      >
        <RiSunLine class="hidden size-5 dark:block" />
        <RiMoonLine class="size-5 dark:hidden" />
      </Button>
      <UserProfileNav />
    </div>
  </div>
</header>
