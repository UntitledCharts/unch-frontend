import { CDN_URL } from "$lib/config.js";
import type { RequestHandler } from "./$types";

// Serves CDN audio (and chart files) from our own origin so the browser can decode them; the CDN sends no
// CORS headers. Only CDN URLs are accepted, so this can't be used as an open proxy.
// ?bytes=N returns just the first N bytes, enough to draw a card's waveform without the whole song.
export const GET: RequestHandler = async ({ url, fetch }) => {
  const target = url.searchParams.get("url");
  if (!target || !target.startsWith(`${CDN_URL}/`)) {
    return new Response("Only CDN files can be proxied", { status: 400 });
  }

  const bytes = Number(url.searchParams.get("bytes"));
  const headers: Record<string, string> = {};

  try {
    if (Number.isInteger(bytes) && bytes > 0) {
      // MP3s often open with an ID3 tag holding embedded artwork (over 1 MB isn't rare), so the first N
      // bytes can be pure metadata with no audio to decode. Skip past the tag before taking the slice.
      const start = await id3TagLength(fetch, target);
      headers.Range = `bytes=${start}-${start + bytes - 1}`;
    }

    const res = await fetch(target, { headers });
    if (!res.ok || !res.body) {
      return new Response("Audio unavailable", { status: 502 });
    }

    // a partial response goes out as a plain 200: to the browser it's simply a shorter file
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Audio proxy failed:", error);
    return new Response("Audio proxy failed", { status: 502 });
  }
};

// Length of a leading ID3v2 tag (header + body + optional footer), or 0 if the file doesn't start with one.
async function id3TagLength(fetchFn: typeof fetch, target: string): Promise<number> {
  const res = await fetchFn(target, { headers: { Range: "bytes=0-9" } }).catch(() => null);
  if (!res?.ok) return 0;
  const h = new Uint8Array(await res.arrayBuffer());
  if (h.length < 10 || h[0] !== 0x49 || h[1] !== 0x44 || h[2] !== 0x33) return 0; // "ID3"
  // the size is "synchsafe": four bytes of 7 bits each
  const size = ((h[6] & 0x7f) << 21) | ((h[7] & 0x7f) << 14) | ((h[8] & 0x7f) << 7) | (h[9] & 0x7f);
  const hasFooter = (h[5] & 0x10) !== 0;
  return 10 + size + (hasFooter ? 10 : 0);
}
