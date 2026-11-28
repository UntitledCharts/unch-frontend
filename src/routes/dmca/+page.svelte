<script lang="ts">
  import SiteHeader from "$lib/components/site-header.svelte";
  import SiteFooter from "$lib/components/site-footer.svelte";
  import Seo from "$lib/components/seo.svelte";
  import { ogSiteUrl } from "$lib/config.js";
  import { RiArrowLeftLine, RiDiscordFill, RiArrowDownSLine } from "$lib/icons.js";

  const DISCORD = "https://discord.com/invite/untitledcharts";
  // bump this when the policy text changes
  const UPDATED = "2026-11-27";

  // legal text, so it stays in English instead of going through the translations
  const INTRO =
    "Every chart on UntitledCharts is uploaded by a player. Sometimes, that means content gets uploaded that the rights holder never agreed to. You may file a formal DMCA request, or send us an informal takedown request on Discord.";
  const needs = [
    "Links to the infringing content.",
    "The content you own and the original location.",
    "Contact information.",
    "A statement that you believe in good faith the upload isn't allowed, and, under penalty of perjury, that your request is accurate and you own the rights or act for the owner.",
    "Your legal full name.",
  ];
  const counterNeeds = [
    "The removed content's original links.",
    "A statement, under penalty of perjury, that you believe in good faith it was removed by mistake.",
    "Your name, address and phone number, and that you accept your local court's jurisdiction and legal papers from the person who reported it.",
    "Your legal full name.",
  ];
  const ticketSteps = [
    { text: "Join our Discord server.", gif: "/guidegifs/guide1.gif" },
    { text: "Open a ticket in #tickets and paste your request.", gif: "/guidegifs/guide2.gif" },
  ];

  const updated = $derived(
    new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
  );
</script>

<Seo
  title="Copyright &amp; DMCA"
  description={INTRO}
  image={ogSiteUrl("Copyright & DMCA", "How takedown requests work on UntitledCharts")}
/>

<SiteHeader />

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
  <a
    href="/"
    class="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors"
  >
    <RiArrowLeftLine class="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    Home
  </a>

  <h1 class="font-heading mt-6 text-3xl font-bold sm:text-4xl">Copyright &amp; DMCA</h1>
  <p class="text-muted-foreground mt-2 text-sm">Last updated {updated}</p>
  <p class="mt-5 text-[15px] leading-relaxed">{INTRO}</p>

  <div class="mt-10 space-y-10 text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_li]:pl-1 [&_p]:text-foreground/85 [&_li]:text-foreground/85">
    <section class="space-y-4">
      <h2>Send a Takedown Request</h2>
      <p>Open a ticket on our Discord with:</p>
      <ul class="list-disc space-y-2 pl-5">
        {#each needs as need (need)}<li>{need}</li>{/each}
      </ul>

      <div class="bg-card flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-foreground! font-semibold">Open a ticket on Discord</p>
        <a
          href={DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 text-sm font-semibold text-white! transition-opacity hover:opacity-90"
        >
          <RiDiscordFill class="size-4" />
          Join the Discord
        </a>
      </div>

      <details class="group bg-card rounded-2xl border">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          How to open a ticket
          <RiArrowDownSLine class="text-muted-foreground size-5 transition-transform group-open:rotate-180" />
        </summary>
        <ol class="space-y-5 border-t px-5 py-5">
          {#each ticketSteps as step, i (step.text)}
            <li class="space-y-2 pl-0!">
              <p class="text-sm"><span class="font-semibold tabular-nums">{i + 1}.</span> {step.text}</p>
              <img src={step.gif} alt={step.text} loading="lazy" class="w-full rounded-xl border" />
            </li>
          {/each}
        </ol>
      </details>
    </section>

    <section class="space-y-3">
      <h2>What Happens Next</h2>
      <p>We will review your takedown request. If it's valid, we will remove the content and inform the uploader.</p>
    </section>

    <section class="space-y-3">
      <h2>Filing a Counter-Notice</h2>
      <p>Open a ticket with:</p>
      <ul class="list-disc space-y-2 pl-5">
        {#each counterNeeds as need (need)}<li>{need}</li>{/each}
      </ul>
      <p>We forward this counter-notice to the person who reported it. If they don't take legal action within 10-14 business days, you may reupload the chart.</p>
    </section>

    <section class="space-y-3">
      <h2>Repeat Infringement and False Requests</h2>
      <p>Accounts that re-upload removed content without a successful counter-notice, or receive multiple valid takedown requests, will be banned.</p>
      <p>Knowingly submitting false information in a takedown request or counter-notice may make you liable under 17 U.S.C. § 512(f).</p>
    </section>
  </div>
</main>

<SiteFooter />
