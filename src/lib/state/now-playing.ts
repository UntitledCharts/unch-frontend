// Only one thing on the page makes sound at a time: a song bar, a card's waveform or the chart
// preview. Whatever starts playing claims the slot and the previous holder is paused.
type Player = { stop: () => void };

let current: Player | null = null;

export function claimPlayback(player: Player) {
  if (current && current !== player) current.stop();
  current = player;
}

export function releasePlayback(player: Player) {
  if (current === player) current = null;
}
