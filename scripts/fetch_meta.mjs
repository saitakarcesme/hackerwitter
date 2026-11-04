// Optional, runs as the Vercel build step: fetch durations, view/like counts and upload dates from the
// YouTube Data API into public/data/meta.json. YouTube's terms don't allow redistributing this data, so it
// is never committed: it's fetched fresh on every deploy, with the key kept in a Vercel env variable.
// Without YOUTUBE_API_KEY this does nothing and the site works without durations (no Longs).
// Usage: YOUTUBE_API_KEY=... node scripts/fetch_meta.mjs
import { readFileSync, writeFileSync } from "node:fs";

const key = process.env.YOUTUBE_API_KEY;
const out = new URL("../public/data/meta.json", import.meta.url);
if (!key) { console.log("YOUTUBE_API_KEY not set: skipping YouTube metadata"); process.exit(0); }

const vids = JSON.parse(readFileSync(new URL("../public/data/videos.json", import.meta.url))).map(v => v.vid);
const secs = (iso) => { const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "") || [];
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0); };
const meta = {};
for (let i = 0; i < vids.length; i += 50) {
  const ids = vids.slice(i, i + 50);
  const q = new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(","), key, fields:
    "items(id,snippet/publishedAt,contentDetails/duration,statistics(viewCount,likeCount),status(privacyStatus,embeddable))" });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?${q}`);
  if (!r.ok) { console.error("YouTube API error", r.status, await r.text()); process.exit(0); }   // never fail the deploy
  const got = new Map((await r.json()).items.map(it => [it.id, it]));
  for (const v of ids) {
    const it = got.get(v);
    // missing from the response: deleted or private, so the site hides it
    meta[v] = it && it.status?.privacyStatus !== "private"
      ? [secs(it.contentDetails?.duration), +it.statistics?.viewCount || 0,
         it.statistics?.likeCount != null ? +it.statistics.likeCount : null, it.snippet?.publishedAt?.slice(0, 10)]
      : null;
  }
}
writeFileSync(out, JSON.stringify(meta));
console.log(`wrote metadata for ${Object.values(meta).filter(Boolean).length} of ${vids.length} videos`);
