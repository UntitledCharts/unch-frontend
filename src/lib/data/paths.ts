// Where things live on this site. Written here once so a link is never built by hand.

export const levelPath = (chartId: string) => `/levels/UnCh-${chartId}`;

export const userPath = (handle: number | string) => `/users/${handle}`;

// a replay is named for the chart it was played on and the score's id
export const replayPath = (replayName: string) => `/replays/${replayName}`;

export const editPath = (chartId: string) => `/dashboard/edit/UnCh-${chartId}`;

// chart and user text may carry :emoji: codes; this is the text without them, for titles and links
export const plainText = (text: string) => text.replace(/:[a-zA-Z0-9_]+:/g, "").trim();
