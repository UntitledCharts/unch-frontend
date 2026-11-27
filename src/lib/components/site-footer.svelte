<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import { RiGithubFill, RiDiscordFill } from "$lib/icons.js";
  import LanguageSelect from "$lib/components/language-select.svelte";
  import { sonolusOpenUrl } from "$lib/config.js";

  const groups = [
    {
      heading: "footer.browse",
      links: [
        { label: "footer.allCharts", href: "/browse" },
      ],
    },
    {
      heading: "footer.legal",
      links: [{ label: "footer.dmca", href: "/dmca" }],
    },
  ];
</script>

<footer class="border-border/60 mt-20 border-t">
  <div
    class="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6"
  >
    <div class="max-w-sm space-y-2">
      <div class="relative inline-block">
        <img
          src="/miku-sitting.png"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute -top-11 left-0 w-[60px] max-w-none select-none drop-shadow-lg sm:-top-16 sm:-left-1 sm:w-20"
        />
        <span
          class="font-heading from-foreground to-primary bg-linear-to-r bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl"
          >UntitledCharts</span
        >
      </div>
      <p class="text-xs leading-relaxed">
        {t("footer.tagline")}
      </p>
      <a
        href={sonolusOpenUrl()}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white! transition-all hover:opacity-90"
        style="background: #000; border: 1px solid rgba(255,255,255,0.1)"
      >
        <svg
          fill="currentColor"
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-2.5a.5.5 0 0 1 1 0V14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h2.5a.5.5 0 0 1 0 1H6Zm5-.5c0-.28.22-.5.5-.5h5c.28 0 .5.22.5.5v5a.5.5 0 0 1-1 0V4.7l-4.15 4.15a.5.5 0 0 1-.7-.7L15.29 4H11.5a.5.5 0 0 1-.5-.5Z"
            fill="currentColor"
          ></path>
        </svg>
        {t("footer.openInSonolus")}
      </a>
    </div>

    <div class="flex gap-12">
      {#each groups as group (group.heading)}
        <nav class="space-y-2" aria-label={t(group.heading)}>
          <p class="text-foreground text-xs font-semibold">{t(group.heading)}</p>
          <ul class="space-y-1.5">
            {#each group.links as link (link.href)}
              <li>
                <a href={link.href} class="hover:text-foreground text-xs transition-colors"
                  >{t(link.label)}</a
                >
              </li>
            {/each}
          </ul>
        </nav>
      {/each}
    </div>
  </div>

  <div
    class="border-border/60 text-muted-foreground mx-auto flex max-w-7xl items-center justify-between gap-4 border-t px-4 py-4 text-[11px] sm:px-6"
  >
    <span>{t("footer.copyright", [new Date().getFullYear()])}</span>
    <div class="flex items-center gap-2">
      <LanguageSelect up class="w-44" />
      <a
        href="https://discord.com/invite/untitledcharts"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discord"
        class="hover:text-foreground inline-flex size-7 items-center justify-center rounded-full transition-colors"
      >
        <RiDiscordFill class="size-4" />
      </a>
      <a
        href="https://github.com/UntitledCharts"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        class="hover:text-foreground inline-flex size-7 items-center justify-center rounded-full transition-colors"
      >
        <RiGithubFill class="size-4" />
      </a>
    </div>
  </div>
</footer>
