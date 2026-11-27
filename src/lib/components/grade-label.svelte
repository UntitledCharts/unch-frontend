<script lang="ts" module>
  // The result a play earned, spelled out the way rhythm games print it on the results screen.
  const GRADES: Record<string, { label: string; tone: string }> = {
    allPerfect: { label: "ALL PERFECT", tone: "ap" },
    fullPerfect: { label: "ALL PERFECT", tone: "ap" },
    fullCombo: { label: "FULL COMBO", tone: "fc" },
    clear: { label: "PASS", tone: "clear" },
    pass: { label: "PASS", tone: "clear" },
  };

  export function gradeLabel(grade: string) {
    return GRADES[grade]?.label ?? grade.toUpperCase();
  }
</script>

<script lang="ts">
  import { cn } from "$lib/utils.js";

  let { grade, class: className }: { grade: string; class?: string } = $props();

  const meta = $derived(GRADES[grade] ?? { label: grade.toUpperCase(), tone: "clear" });
</script>

<span class={cn("grade", meta.tone, className)}>{meta.label}</span>

<style>
  /* upright, heavy, and a soft pastel gradient running left to right, like the results screen */
  .grade {
    display: inline-block;
    white-space: nowrap;
    font-family: var(--font-rodin);
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1.1;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
  /* pastel on a light page needs an edge to stay readable */
  :global(html:not(.dark)) .grade {
    filter: drop-shadow(0 0 0.5px rgb(40 20 70 / 0.9));
  }
  .ap {
    background-image: linear-gradient(90deg, #fff6b8 0%, #ffd0e6 30%, #f2c2ff 55%, #c7c8ff 75%, #a9e2ff 100%);
  }
  .fc {
    background-image: linear-gradient(90deg, #ffd9ec 0%, #fff4fa 40%, #e9d6ff 70%, #c9c3ff 100%);
  }
  .clear {
    background-image: linear-gradient(90deg, #fffdf6 0%, #fbf3e0 55%, #f1e2c2 100%);
  }
</style>
