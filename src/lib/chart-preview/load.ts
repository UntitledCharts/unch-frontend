import { ungzip } from "pako";
import type { LevelDataEntity } from "@sonolus/core";
import { parseLevelDataChart } from "./chart/parse/levelData";
import { createState, type State } from "./state";

export async function loadPreviewState(chartUrl: string): Promise<State> {
  const buf = await fetch(chartUrl).then((r) => r.arrayBuffer());
  const text = new TextDecoder().decode(ungzip(new Uint8Array(buf)));
  const levelData = JSON.parse(text) as { bgmOffset?: number; entities: LevelDataEntity[] };
  const chart = parseLevelDataChart(levelData.entities);
  return createState(chart, levelData.bgmOffset ?? 0);
}

// The item to use from a server list: the first preferred name the server has, else its first item.
export async function pickItemName(
  server: string,
  type: "skins" | "particles" | "effects",
  preferred: string[] = [],
): Promise<string | undefined> {
  try {
    const list = (await fetch(`${server}/sonolus/${type}/list`).then((r) => r.json())) as {
      items?: { name: string }[];
    };
    const names = list.items?.map((i) => i.name) ?? [];
    return preferred.find((n) => names.includes(n)) ?? names[0];
  } catch {
    return undefined;
  }
}
