<script lang="ts">
  import { t } from "$lib/i18n.svelte.js";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import Seo from "$lib/components/seo.svelte";
  import { RiArrowLeftLine, RiDiscordFill, RiArrowDownSLine } from "$lib/icons.js";

  const DISCORD = "https://discord.com/invite/untitledcharts";
  // bump this when the policy text changes
  const UPDATED = "2026-11-01";

  const needs = [1, 2, 3, 4, 5, 6].map((n) => `dmca.need${n}`);
  const counterNeeds = [1, 2, 3, 4, 5].map((n) => `dmca.counter${n}`);
  const ticketSteps = [
    { text: "dmca.ticketStep1", gif: "/guidegifs/guide1.gif" },
    { text: "dmca.ticketStep2", gif: "/guidegifs/guide2.gif" },
  ];

  const updated = $derived(
    new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
  );
</script>

<Seo
  title={t("dmca.title")}
  description={t("dmca.intro")}
  image="/og?title=Copyright+%26+DMCA&subtitle=How+takedown+requests+work+on+UntitledCharts"
/>

<SiteHeader />

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
  <a
    href="/"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    {t("nav.home")}
  </a>

  <h1 class="font-heading mt-6 text-3xl font-bold sm:text-4xl">{t("dmca.title")}</h1>
  <p class="text-muted-foreground mt-2 text-sm">{t("dmca.updated", [updated])}</p>
  <p class="mt-5 text-[15px] leading-relaxed">{t("dmca.intro")}</p>

  <div class="mt-10 space-y-10 text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_li]:pl-1 [&_p]:text-foreground/85 [&_li]:text-foreground/85">
    <section class="space-y-4">
      <h2>{t("dmca.sendTitle")}</h2>
      <p>{t("dmca.sendBody")}</p>
      <ul class="list-disc space-y-2 pl-5">
        {#each needs as key (key)}<li>{t(key)}</li>{/each}
      </ul>

      <div class="bg-card flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <p class="text-foreground! font-semibold">{t("dmca.ticketCardTitle")}</p>
          <p class="text-muted-foreground! text-sm">{t("dmca.ticketCardBody")}</p>
        </div>
        <a
          href={DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 text-sm font-semibold text-white! transition-opacity hover:opacity-90"
        >
          <RiDiscordFill class="size-4" />
          {t("dmca.joinDiscord")}
        </a>
      </div>

      <details class="group bg-card rounded-2xl border">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          {t("dmca.ticketGuide")}
          <RiArrowDownSLine class="text-muted-foreground size-5 transition-transform group-open:rotate-180" />
        </summary>
        <ol class="space-y-5 border-t px-5 py-5">
          {#each ticketSteps as step, i (step.text)}
            <li class="space-y-2 pl-0!">
              <p class="text-sm"><span class="font-semibold tabular-nums">{i + 1}.</span> {t(step.text)}</p>
              <img src={step.gif} alt={t(step.text)} loading="lazy" class="w-full rounded-xl border" />
            </li>
          {/each}
        </ol>
      </details>
    </section>

    <section class="space-y-3">
      <h2>{t("dmca.afterTitle")}</h2>
      <p>{t("dmca.afterBody1")}</p>
      <p>{t("dmca.afterBody2")}</p>
    </section>

    <section class="space-y-3">
      <h2>{t("dmca.counterTitle")}</h2>
      <p>{t("dmca.counterBody")}</p>
      <ul class="list-disc space-y-2 pl-5">
        {#each counterNeeds as key (key)}<li>{t(key)}</li>{/each}
      </ul>
      <p>{t("dmca.counterAfter")}</p>
    </section>

    <section class="space-y-3">
      <h2>{t("dmca.repeatTitle")}</h2>
      <p>{t("dmca.repeatBody")}</p>
    </section>

    <section class="space-y-3">
      <h2>{t("dmca.misuseTitle")}</h2>
      <p>{t("dmca.misuseBody1")}</p>
      <p>{t("dmca.misuseBody2")}</p>
    </section>

    <p class="text-muted-foreground! border-t pt-6 text-sm">{t("dmca.footnote")}</p>
  </div>
</main>

<SiteFooter />
