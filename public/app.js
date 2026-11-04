// Hackerwitter: the videos Hacker News keeps telling each other to watch, as a timeline.
// Everything runs in the browser from static JSON under /data. No accounts: likes, bookmarks,
// follows and history live in localStorage.
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $("#view"), side = $("#side");
const REPO = "https://github.com/saitakarcesme/hackerwitter";
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---------- local state ----------
let likes = store.get("likes", []), dislikes = store.get("dislikes", []);
let seen = store.get("seen", []);            // videos opened, newest last; kept out of For you
let bookmarks = store.get("later", []);      // HackerTube's "Watch later", newest last
let follows = store.get("follows", []);      // channel handles
let useFrames = store.get("frames", true);
// a fresh seed on every page load: reloading rerolls For you, going back from a post keeps it
const seed = Math.floor(Math.random() * 2 ** 31);

function toggleIn(list, id) { const i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); return i < 0; }
function markSeen(vid) { seen = seen.filter(v => v !== vid).concat(vid).slice(-200); store.set("seen", seen); }
function saveVotes() { store.set("likes", likes); store.set("dislikes", dislikes); }

// ---------- icons ----------
const P = {
  home: "M4 21V10.08l8-6.96 8 6.96V21h-6v-6h-4v6H4z",
  homeO: "M12 3.12 4 10.08V21h6v-6h4v6h6V10.08l-8-6.96zM18 19h-2v-6H8v6H6v-8l6-5.2 6 5.2v8z",
  search: "M20.87 20.17l-5.59-5.59A6.95 6.95 0 0 0 17 10a7 7 0 1 0-7 7c1.75 0 3.35-.64 4.58-1.71l5.59 5.59.7-.71zM10 16a6 6 0 1 1 0-12 6 6 0 0 1 0 12z",
  longs: "M3 6h18v12H3zm2 2v8h14V8zm4 1.5v5l4.5-2.5z",
  list: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  bm: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z",
  bmOn: "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z",
  heart: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  heartOn: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  history: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  settings: "M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z",
  info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  reply: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z",
  repost: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  views: "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z",
  share: "M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z",
  more: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  play: "M8 5v14l11-7z",
  verified: "M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z",
  shuffle: "M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  block: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  ext: "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
  person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  spark: "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z",
  bolt: "M7 2v11h3v9l7-12h-4l4-8z",
  compass: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5 7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z",
  filter: "M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z",
  download: "M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  note: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  key: "M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
};
const I = (name, cls = "") => `<svg viewBox="0 0 24 24"${cls ? ` class="${cls}"` : ""} aria-hidden="true"><path d="${P[name]}"/></svg>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 6h4v20H7zm14 0h4v20h-4zM11 17.6l10-6v4.2l-10 6z"/></svg>`;

// ---------- formatting ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Number(n).toLocaleString("en-US");
const compact = (n) => n == null ? "" : n >= 1e9 ? `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`
  : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n);
const dur = (s) => { if (!s) return ""; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
const hours = (m) => m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateLong = (iso) => { const d = new Date(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const ym = (s) => s ? `${MONTHS[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "";
const plural = (n, w) => `${fmt(n)} ${w}${n === 1 ? "" : "s"}`;

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// weighted shuffle (Efraimidis–Spirakis): heavier items tend to come first, but every reload differs
function wshuffle(items, weight, rand) {
  return items.map(x => [Math.pow(rand(), 1 / Math.max(weight(x), 1e-6)), x]).sort((a, b) => b[0] - a[0]).map(p => p[1]);
}
const initials = (name) => {
  const w = String(name).replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] || "?") + (w.length > 1 ? w[1][0] : (w[0]?.[1] || ""))).toUpperCase();
};
const avColor = (s) => `hsl(${hash(s) % 360} 42% 42%)`;
const avatar = (name, cls = "") => `<span class="av ${cls}" style="background:${avColor(name)}">${esc(initials(name))}</span>`;

// ---------- data ----------
const DB = { videos: [], byVid: new Map(), cats: new Map(), areas: [], playlists: [], stats: {}, meta: {}, channels: new Map() };
let hasMeta = false;
// lowercase, punctuation to spaces, so " rust" matches "(Rust)" and phrase checks line up
const norm = (s) => " " + String(s).toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, " ").trim() + " ";
async function getJSON(path) { const r = await fetch(path); if (!r.ok) throw new Error(r.status); return r.json(); }

async function loadData() {
  const [videos, areas, playlists, stats, meta] = await Promise.all([
    getJSON("/data/videos.json"), getJSON("/data/taxonomy.json"), getJSON("/data/playlists.json"),
    getJSON("/data/stats.json"), getJSON("/data/meta.json").catch(() => ({})),
  ]);
  DB.meta = meta || {};
  hasMeta = Object.keys(DB.meta).length > 0;
  // a null entry in the YouTube metadata means the video was deleted or made private: hide it
  DB.videos = videos.filter(v => !(v.vid in DB.meta) || DB.meta[v.vid]);
  for (const v of DB.videos) {
    const m = DB.meta[v.vid];
    if (m) [v.duration_s, v.views, v.likes, v.published] = m;
    v.hay = norm([v.title, v.channel, v.topic, v.tags.join(" "), v.summary, v.why].join(" | "));
    v.htitle = norm([v.title, v.channel, v.topic, v.tags.join(" ")].join(" | "));
    DB.byVid.set(v.vid, v);
    let c = DB.channels.get(v.handle);
    if (!c) DB.channels.set(v.handle, c = { handle: v.handle, channel: v.channel, vids: [], score: 0, recommenders: 0, months: 0, first: 9999, last: 0, cats: {} });
    c.vids.push(v); c.score += v.score; c.recommenders += v.hn.recommenders; c.months += v.hn.rec_months;
    c.first = Math.min(c.first, v.hn.first); c.last = Math.max(c.last, v.hn.last);
    for (const id of v.cats) c.cats[id] = (c.cats[id] || 0) + 1;
  }
  DB.areas = areas;
  for (const a of areas) for (const c of a.categories) DB.cats.set(c.id, { ...c, area: a.id, area_name: a.name });
  DB.playlists = playlists;
  DB.stats = stats;
}
const detailCache = new Map();
function detail(vid) {
  if (!detailCache.has(vid)) detailCache.set(vid, getJSON(`/data/v/${vid}.json`).catch(() => ({ comments: [], hn_related: [], similar: [], whys: [] })));
  return detailCache.get(vid);
}
const channelOf = (v) => DB.channels.get(v.handle);
function badge(c) {
  if (!c || c.vids.length < 5) return "";
  const gold = c.vids.length >= 15;
  return `<span title="${esc(`${c.vids.length} videos recommended on Hacker News`)}">${I("verified", "badge" + (gold ? " gold" : ""))}</span>`;
}

// ---------- thumbnails ----------
// "Video frames" setting (on by default): a frame from the middle of the video (hq2.jpg) instead of
// the uploader's attention-optimized thumbnail. A missing frame falls back to the regular thumbnail.
const thumbSrc = (vid) => `https://i.ytimg.com/vi/${vid}/${useFrames ? "hq2" : "hqdefault"}.jpg`;
window.thumbFallback = (img) => { if (img.src.includes("/hq2.jpg")) img.src = `https://i.ytimg.com/vi/${img.dataset.vid}/hqdefault.jpg`; else img.onerror = null; };
const img = (vid, lazy = true) => `<img${lazy ? ` loading="lazy"` : ""} src="${thumbSrc(vid)}" data-vid="${vid}" onerror="thumbFallback(this)" alt="">`;
const embed = (v) => `<iframe src="https://www.youtube-nocookie.com/embed/${v.vid}?rel=0&autoplay=1" title="${esc(v.title)}"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

// ---------- components ----------
const STANCE = { strong_rec: "Strongly recommends", rec: "Recommends", reference: "Cites", joke: "Joke", critical: "Critical" };
const CTX_ICON = { classic: "repost", gem: "spark", recent: "bolt", explore: "compass", similar: "heartOn", co: "repost", follow: "person", topic: "search", playlist: "list" };

const when = (v) => v.published ? dateLong(v.published) : `HN ${v.hn.first}`;
const whenShort = (v) => {
  if (!v.published) return `${v.hn.first}`;
  const d = new Date(v.published), now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}` : dateLong(v.published);
};

function media(v, { lazy = true, info = false } = {}) {
  return `<div class="media"><div class="frame" data-play="${v.vid}" role="button" aria-label="Play ${esc(v.title)}">${img(v.vid, lazy)}
      <span class="play">${I("play")}</span>${v.duration_s ? `<span class="dur">${dur(v.duration_s)}</span>` : ""}</div>
    ${info ? `<a class="cardinfo" href="/status/${v.vid}"><div class="dom">youtube.com</div><div class="ttl">${esc(v.title)}</div></a>` : ""}</div>`;
}

function actions(v, wide = false) {
  const liked = likes.includes(v.vid), saved = bookmarks.includes(v.vid);
  const likeN = v.likes != null ? compact(v.likes + (liked ? 1 : 0)) : "";
  return `<div class="acts${wide ? " wide" : ""}">
    <a class="act reply" href="/status/${v.vid}" title="${esc(plural(v.hn.mentions, "Hacker News comment"))}"><span class="ib">${I("reply")}</span>${wide ? "" : v.hn.mentions}</a>
    <a class="act rp" href="/status/${v.vid}" title="${esc(plural(v.hn.recommenders, "HN person") + " recommended this")}"><span class="ib">${I("repost")}</span>${wide ? "" : v.hn.recommenders || ""}</a>
    <button class="act like${liked ? " on" : ""}" data-act="like" data-vid="${v.vid}" title="${liked ? "Unlike" : "Like"}"><span class="ib">${I(liked ? "heartOn" : "heart")}</span><span>${wide ? "" : likeN}</span></button>
    ${v.views != null ? `<a class="act views" href="/status/${v.vid}" title="${esc(fmt(v.views) + " views on YouTube")}"><span class="ib">${I("views")}</span>${wide ? "" : compact(v.views)}</a>` : ""}
    <span class="actgroup">
      <button class="act bm${saved ? " on" : ""}" data-act="bm" data-vid="${v.vid}" title="${saved ? "Remove Bookmark" : "Bookmark"}"><span class="ib">${I(saved ? "bmOn" : "bm")}</span></button>
      <button class="act share" data-act="share" data-vid="${v.vid}" title="Copy link"><span class="ib">${I("share")}</span></button>
    </span></div>`;
}

const ctxLine = (ctx) => ctx ? `<div class="ctx"><span class="ic">${I(CTX_ICON[ctx.kind] || "repost")}</span><span>${esc(ctx.text)}</span></div>` : "";

function quoteBox(v) {
  const q = v.quote;
  if (!q || !q.text) return "";
  return `<a class="qpost" href="https://news.ycombinator.com/item?id=${q.id}" target="_blank" rel="noopener" title="View this comment on Hacker News">
    <div class="phd"><span class="av hnu">Y</span><span class="name">Hacker News</span><span class="handle">@ycombinator</span><span class="dot">·</span><time>${esc(q.year)}</time></div>
    <p class="ptext">“${esc(q.text)}”</p></a>`;
}

// one video as a post: the channel posts its video, HN's best pull quote is the quoted post
function post(v, { ctx = null, note = "" } = {}) {
  const c = channelOf(v);
  return `<article class="post" data-href="/status/${v.vid}" data-vid="${v.vid}">
    ${ctxLine(ctx)}
    <div class="prow">
      <a href="/@${v.handle}" aria-label="${esc(v.channel)}">${avatar(v.channel)}</a>
      <div class="pbody">
        <div class="phd"><a class="name" href="/@${v.handle}">${esc(v.channel)}</a>${badge(c)}<span class="handle">@${esc(v.handle)}</span>
          <span class="dot">·</span><a href="/status/${v.vid}"><time title="${esc(v.published ? dateLong(v.published) : `On HN ${v.hn.first}–${v.hn.last}`)}">${esc(whenShort(v))}</time></a>
          <button class="more" data-act="more" data-vid="${v.vid}" aria-label="More">${I("more")}</button></div>
        <p class="ptext">${esc(v.title)}</p>
        ${media(v, { info: false })}
        ${note ? `<div class="note"><b>${I("note")}Note from the list</b>${esc(note)}</div>` : quoteBox(v)}
        ${actions(v)}
      </div>
    </div></article>`;
}

const commentHTML = (t) => esc(t).replace(/\[VIDEO\]/g, `<span class="mk">▶ this video</span>`).replace(/\[LINK\]/g, `<span class="mk l">link</span>`);
function replyHTML(m, v) {
  return `<article class="post reply"><div class="prow">
    <a href="https://news.ycombinator.com/user?id=${encodeURIComponent(m.author)}" target="_blank" rel="noopener">${avatar(m.author, "")}</a>
    <div class="pbody">
      <div class="phd"><a class="name" href="https://news.ycombinator.com/user?id=${encodeURIComponent(m.author)}" target="_blank" rel="noopener">${esc(m.author)}</a>
        <span class="handle">@${esc(m.author)}</span><span class="dot">·</span>
        <a href="https://news.ycombinator.com/item?id=${m.id}" target="_blank" rel="noopener"><time>${esc(ym(m.ym))}</time></a></div>
      <div class="rto">Replying to <a class="link" href="/@${v.handle}">@${esc(v.handle)}</a> in “${esc(m.story)}”</div>
      <p class="ptext">${commentHTML(m.text)}</p>
      <div class="rfoot"><span class="stance ${m.stance}">${STANCE[m.stance] || m.stance}</span>
        <a href="https://news.ycombinator.com/item?id=${m.id}" target="_blank" rel="noopener">View on Hacker News</a></div>
    </div></div></article>`;
}

const nextRow = (v) => `<a class="next" href="/status/${v.vid}"><div class="nthumb">${img(v.vid)}${v.duration_s ? `<span class="dur">${dur(v.duration_s)}</span>` : ""}</div>
  <div style="min-width:0"><div class="nt">${esc(v.title)}</div><div class="ns">${esc(v.channel)}</div>
  <div class="ns">${v.hn.recommenders ? `${plural(v.hn.recommenders, "HN recommender")}` : `Cited ${v.hn.mentions}× on HN`}</div></div></a>`;

function followBtn(handle, sm = true) {
  const on = follows.includes(handle);
  return `<button class="btn${sm ? " sm" : ""}${on ? " ghost following" : ""}" data-act="follow" data-handle="${esc(handle)}"
    onmouseenter="if(this.classList.contains('following'))this.textContent='Unfollow'" onmouseleave="if(this.classList.contains('following'))this.textContent='Following'">${on ? "Following" : "Follow"}</button>`;
}
function channelRow(c, desc = false) {
  const top = Object.entries(c.cats).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => DB.cats.get(id)?.name).filter(Boolean);
  return `<a class="row" href="/@${c.handle}">${avatar(c.channel)}<div class="rb"><b><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.channel)}</span>${badge(c)}</b>
    <div class="muted">@${esc(c.handle)}</div>${desc ? `<p>${esc(plural(c.vids.length, "video"))} HN recommends${top.length ? `, mostly ${esc(top.join(" and ").toLowerCase())}` : ""}.</p>` : ""}</div>
    ${followBtn(c.handle)}</a>`;
}

const head = (title, sub = "", back = true, extra = "") => `<div class="head"><div class="bar">
  ${back ? `<button class="back" data-act="back" aria-label="Back">${I("back")}</button>` : ""}
  <div style="min-width:0;flex:1"><h2>${esc(title)}</h2>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>${extra}</div></div>`;
const tabs = (items, active) => `<div class="tabs">${items.map(([href, label, key]) =>
  `<a class="tab${key === active ? " on" : ""}" href="${href}">${esc(label)}</a>`).join("")}</div>`;

// ---------- infinite lists ----------
let pager = null;
function infinite(container, items, render, pageSize = 20, start = 0) {
  if (pager) pager.disconnect();
  let shown = 0;
  const sentinel = document.createElement("div"); sentinel.className = "sentinel";
  container.after(sentinel);
  const more = (n = pageSize) => {
    const next = items.slice(shown, shown + n);
    container.insertAdjacentHTML("beforeend", next.map(render).join(""));
    shown += next.length;
    container.dataset.shown = shown;
    if (shown >= items.length) { pager?.disconnect(); sentinel.remove(); }
  };
  more(Math.max(pageSize, start));
  if (shown < items.length) {
    pager = new IntersectionObserver((e) => e[0].isIntersecting && more(), { rootMargin: "1200px" });
    pager.observe(sentinel);
  }
}
const emptyState = (title, text, cta = "") => `<div class="empty"><h2>${esc(title)}</h2><p>${esc(text)}</p>${cta}</div>`;

// ---------- recommendations ----------
// For you mixes several kinds of picks, like HackerTube's Home: HN classics, hidden gems, recent
// favorites, topics you haven't explored, and once you like a few videos, similar ones and ones the
// same HN people also recommended. The context line above each post says why it's there.
const isGem = (v) => hasMeta ? (v.views != null && v.views < 100000 && v.hn.recommenders >= 1)
  : (v.hn.recommenders >= 3 && v.hn.mentions <= 8 && channelOf(v).vids.length <= 2);

async function buildForYou() {
  const rand = rng(seed);
  const exclude = new Set([...seen, ...dislikes]);
  const pool = DB.videos.filter(v => v.shelf !== "news" && !exclude.has(v.vid));
  const catW = {};
  for (const id of likes) for (const c of DB.byVid.get(id)?.cats || []) catW[c] = (catW[c] || 0) + 1;
  for (const id of dislikes) for (const c of DB.byVid.get(id)?.cats || []) catW[c] = (catW[c] || 0) - 1.5;
  const tilt = (v) => Math.max(0.15, 1 + 0.25 * v.cats.reduce((s, c) => s + (catW[c] || 0), 0));
  const touched = new Set([...likes, ...seen].flatMap(id => DB.byVid.get(id)?.cats || []));

  const src = {};
  src.classic = wshuffle(pool.slice(0, 2500), v => Math.pow(v.score, 1.6) * tilt(v), rand)
    .map(v => [v, { kind: "classic", text: `HN classic · recommended in ${plural(v.hn.rec_months, "month")}` }]);
  src.gem = wshuffle(pool.filter(isGem), v => v.score * tilt(v), rand)
    .map(v => [v, { kind: "gem", text: "Hidden gem · HN loves it, few people have seen it" }]);
  src.recent = wshuffle(pool.filter(v => v.hn.last_rec && v.hn.last_rec >= "2024-01"), v => v.score * tilt(v), rand)
    .map(v => [v, { kind: "recent", text: `Recent favorite · recommended ${ym(v.hn.last_rec)}` }]);
  const fresh = wshuffle([...DB.cats.values()].filter(c => !touched.has(c.id) && c.count >= 5), c => Math.sqrt(c.count), rand);
  src.explore = fresh.map(c => {
    const best = pool.filter(v => v.cats[0] === c.id).slice(0, 4);
    const v = best[Math.floor(rand() * best.length)];
    return v && [v, { kind: "explore", text: `New topic for you · ${c.name}` }];
  }).filter(Boolean);
  const followed = new Set(follows);
  src.follow = wshuffle(pool.filter(v => followed.has(v.handle)), v => v.score, rand)
    .map(v => [v, { kind: "follow", text: `From @${v.handle}, which you follow` }]);

  src.similar = []; src.co = [];
  const recentLikes = likes.slice(-12).reverse().map(id => DB.byVid.get(id)).filter(Boolean);
  if (recentLikes.length) {
    const ds = await Promise.all(recentLikes.map(v => detail(v.vid)));
    const sim = recentLikes.map((v, i) => ds[i].similar.slice(0, 10).map(id => DB.byVid.get(id)).filter(x => x && !exclude.has(x.vid))
      .map(x => [x, { kind: "similar", text: `Because you liked “${v.title}”` }]));
    const co = recentLikes.map((v, i) => ds[i].hn_related.slice(0, 10).map(([id]) => DB.byVid.get(id)).filter(x => x && !exclude.has(x.vid))
      .map(x => [x, { kind: "co", text: `HN people who recommend “${v.title}” also recommend this` }]));
    // round-robin across the liked videos so one like doesn't take over
    for (let r = 0; r < 10; r++) { for (const l of sim) if (l[r]) src.similar.push(l[r]); for (const l of co) if (l[r]) src.co.push(l[r]); }
  }

  const pattern = likes.length
    ? ["similar", "classic", "co", "recent", "similar", "gem", "follow", "classic", "explore", "co", "similar", "recent"]
    : ["classic", "classic", "gem", "recent", "follow", "classic", "explore", "gem", "classic", "recent", "explore"];
  const out = [], used = new Set(), idx = {};
  while (out.length < 1000) {
    let progressed = false;
    for (const k of pattern) {
      const list = src[k]; idx[k] ??= 0;
      while (idx[k] < list.length && used.has(list[idx[k]][0].vid)) idx[k]++;
      if (idx[k] < list.length) { const [v, ctx] = list[idx[k]++]; used.add(v.vid); out.push({ v, ctx }); progressed = true; }
    }
    if (!progressed) break;
  }
  // a timeline shouldn't show the same channel twice in a row
  for (let i = 1; i < out.length; i++) {
    if (out[i].v.handle !== out[i - 1].v.handle) continue;
    const j = out.findIndex((x, k) => k > i && x.v.handle !== out[i - 1].v.handle);
    if (j > 0) out.splice(i, 0, ...out.splice(j, 1));
  }
  return out;
}

// ---------- search ----------
const STOP = new Set("a an the of in on for to and or is are with how what why about".split(" "));
function search(q) {
  const phrase = norm(q).trim();
  const toks = phrase.split(" ").filter(t => t && !STOP.has(t));
  if (!toks.length) return { results: [], weak: true };
  // topic match: categories whose name or synonym-rich description covers the query
  const catHits = new Map();
  for (const c of DB.cats.values()) {
    const name = norm(c.name), desc = norm(c.description);
    if (name.includes(` ${phrase} `) || desc.includes(` ${phrase} `)) catHits.set(c.id, name.includes(` ${phrase} `) ? 6 : 4);
    else if (toks.length > 1 && toks.every(t => desc.includes(` ${t}`))) catHits.set(c.id, 2);
  }
  const res = [];
  for (const v of DB.videos) {
    let s = 0, all = true;
    for (const t of toks) {
      const pt = " " + t;
      if (v.htitle.includes(pt)) s += 3;
      else if (v.hay.includes(pt)) s += 1;
      else all = false;
    }
    if (toks.length > 1 && v.htitle.includes(` ${phrase} `)) s += 4;
    let via = "";
    for (const c of v.cats) if (catHits.has(c)) { s += catHits.get(c); via ||= DB.cats.get(c).name; }
    if (!s) continue;
    const strong = all || (via && s >= 4);
    res.push({ v, s: s * (1 + Math.log1p(v.score) / 3), strong, via });
  }
  const strong = res.filter(r => r.strong);
  const list = (strong.length ? strong : res).sort((a, b) => b.s - a.s).slice(0, 300);
  return { results: list, weak: !strong.length };
}

// ---------- filters (HackerTube's, one URL parameter each so filtered pages are shareable) ----------
const FILTERS = [
  ["Upload date", [["date", "year", "Past year"], ["date", "2020s", "2020s"], ["date", "2010s", "2010s"], ["date", "2000s", "2000s"]], true],
  ["Type", [["type", "talk", "Talk"], ["type", "lecture", "Lecture"], ["type", "explainer", "Explainer"], ["type", "tutorial", "Tutorial"],
            ["type", "documentary", "Documentary"], ["type", "interview", "Interview"], ["type", "demo", "Demo"],
            ["type", "commentary", "Commentary"], ["type", "comedy", "Comedy"], ["type", "music", "Music"]]],
  ["Duration", [["dur", "short", "Under 4 min"], ["dur", "medium", "4–20 min"], ["dur", "long", "20–60 min"], ["dur", "xlong", "Over 1 hour"]], true],
  ["Features", [["gems", "1", "Hidden gems"], ["evergreen", "1", "Evergreen only"]]],
  ["Sort by", [["sort", "", "Relevance"], ["sort", "recent", "Recently recommended"], ["sort", "date", "Upload date", true],
               ["sort", "old", "Oldest first", true], ["sort", "views", "View count", true], ["sort", "liked", "Like ratio", true],
               ["sort", "hn", "Most recommended"]]],
];
const FILTER_KEYS = [...new Set(FILTERS.flatMap(([, o]) => o.map(([k]) => k)))];
const filterParams = () => { const u = new URLSearchParams(location.search); return Object.fromEntries(FILTER_KEYS.map(k => [k, u.get(k) || ""])); };
const withParams = (path, params) => { const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString(); return path + (qs ? `?${qs}` : ""); };
const filtering = (p) => FILTER_KEYS.some(k => k !== "sort" && p[k]);

function applyFilters(list, p, get = (x) => x) {
  const now = Date.now(), YEAR = 365 * 864e5;
  const DUR = { short: [0, 240], medium: [240, 1200], long: [1200, 3600], xlong: [3600, 1e9] };
  let out = list.filter(x => {
    const v = get(x);
    if (p.type && v.type !== p.type && !(p.type === "lecture" && v.type === "course")) return false;
    if (p.evergreen && v.shelf !== "evergreen") return false;
    if (p.gems && !isGem(v)) return false;
    if (p.dur) { const [a, b] = DUR[p.dur] || [0, 1e9]; if (!v.duration_s || v.duration_s < a || v.duration_s >= b) return false; }
    if (p.date) {
      if (!v.published) return false;
      const y = +v.published.slice(0, 4);
      if (p.date === "year" && now - new Date(v.published) > YEAR) return false;
      if (p.date === "2020s" && y < 2020) return false;
      if (p.date === "2010s" && (y < 2010 || y >= 2020)) return false;
      if (p.date === "2000s" && y >= 2010) return false;
    }
    return true;
  });
  const by = (f) => out.sort((a, b) => f(get(b)) - f(get(a)));
  if (p.sort === "recent") out.sort((a, b) => (get(b).hn.last_rec || "").localeCompare(get(a).hn.last_rec || ""));
  else if (p.sort === "date") by(v => v.published ? +new Date(v.published) : 0);
  else if (p.sort === "old") by(v => v.published ? -new Date(v.published) : -1e15);
  else if (p.sort === "views") by(v => v.views || 0);
  else if (p.sort === "liked") by(v => v.views ? (v.likes || 0) / v.views : 0);
  else if (p.sort === "hn") by(v => v.score);
  return out;
}

// the filter panel: in the right column on wide screens ("Search filters", like X), inline on narrow ones
function filterPanel(path, params, listing) {
  const link = (k, v) => withParams(path, { ...params, [k]: params[k] === v ? "" : v });
  return FILTERS.filter(([, , needsMeta]) => hasMeta || !needsMeta).map(([title, opts]) => {
    let o = opts.filter(([, , , needsMeta]) => hasMeta || !needsMeta);
    if (listing && title === "Sort by") o = o.filter(([, v]) => v !== "hn").map(([k, v, l]) => [k, v, v ? l : "Best first"]);
    return `<h4>${title}</h4><div class="opts">${o.map(([k, v, l]) =>
      `<a class="opt${(params[k] || "") === v ? " on" : ""}" href="${link(k, v)}">${esc(l)}</a>`).join("")}</div>`;
  }).join("");
}
function filterLine(path, params, listing, playable = true) {
  const link = (k, v) => withParams(path, { ...params, [k]: params[k] === v ? "" : v });
  const active = FILTERS.flatMap(([, opts]) => opts.filter(([k, v]) => v && params[k] === v)
    .map(([k, v, l]) => `<a class="chip on" href="${link(k, v)}" title="Remove filter">${esc(l)}<span>×</span></a>`));
  return `<div class="filterline"><button class="chip filtbtn" data-act="filters">${I("filter")}Filters</button>${active.join("")}
    <span class="grow"></span>${playable ? playAll() : ""}</div>
    <div class="inlinefilters"><div class="filters">${filterPanel(path, params, listing)}</div></div>`;
}
const playAll = () => `<a class="chip" data-act="playall" href="https://www.youtube.com/" target="_blank" rel="noopener"
  title="Open the posts on this page as a playlist on YouTube">${I("play")}Play all on YouTube</a>`;

// ---------- right column ----------
function searchBox(value = "") {
  return `<form class="searchbox" data-act="search" role="search">${I("search")}<input name="q" type="search" placeholder="Search" value="${esc(value)}" autocomplete="off" aria-label="Search"></form>`;
}
function trending(n, rand) {
  const cats = wshuffle([...DB.cats.values()].filter(c => c.count >= 8), c => c.count, rand).slice(0, n);
  return cats.map(c => `<a class="trend" href="/c/${c.id}"><div class="k">Trending in ${esc(c.area_name)}</div><b>${esc(c.name)}</b><div class="n">${fmt(c.count)} posts</div></a>`).join("");
}
function whoToFollow(n, rand, exclude = []) {
  const ex = new Set([...follows, ...exclude]);
  const top = [...DB.channels.values()].filter(c => !ex.has(c.handle)).sort((a, b) => b.score - a.score).slice(0, 80);
  return wshuffle(top, c => c.score, rand).slice(0, n).map(c => channelRow(c)).join("");
}
function footer() {
  return `<nav class="foot"><a href="/about">About</a><a href="/data">Data</a><a href="#" data-act="help">Keyboard shortcuts</a>
    <a href="${REPO}" target="_blank" rel="noopener">GitHub</a><a href="https://hackertube.org" target="_blank" rel="noopener">Data from HackerTube</a>
    <span>Built with Claude</span></nav>`;
}
function sidebar(kind, extra = {}) {
  const rand = rng(seed + 7);
  const parts = [];
  if (kind !== "explore") parts.push(`<div class="sbox">${searchBox(extra.q || "")}</div>`);
  else parts.push(`<div style="height:12px"></div>`);
  if (kind === "filters") parts.push(`<section class="card"><h3>Search filters</h3><div class="filters">${extra.filters}</div></section>`);
  if (kind === "status") parts.push(extra.html);
  if (kind === "home") parts.push(`<section class="card"><h3>Fork it</h3><div class="pad"><p>Everything here comes from one zip file of
      Hacker News comment analysis. Point your Claude at it and ask for your own version.</p>
      <a class="btn accent" href="/data">${I("download")}Get the data</a></div></section>`);
  if (kind !== "status") parts.push(`<section class="card"><h3>What’s happening</h3>${trending(5, rand)}<a class="showmore" href="/explore">Show more</a></section>`);
  if (kind !== "explore-channels") parts.push(`<section class="card"><h3>Who to follow</h3>${whoToFollow(3, rand, extra.excludeHandles)}<a class="showmore" href="/explore?tab=channels">Show more</a></section>`);
  parts.push(footer());
  side.innerHTML = parts.join("");
}

// ---------- pages ----------
let homeCache = null;   // keeps For you stable (and its scroll position) when coming back from a post
async function home(tab) {
  document.title = "Home / Hackerwitter";
  view.innerHTML = `<div class="head">${tabs([["/", "For you", "foryou"], ["/following", "Following", "following"]], tab)}</div><div id="feed"></div>`;
  sidebar("home");
  const feed = $("#feed");
  if (tab === "following") {
    const set = new Set(follows);
    const items = DB.videos.filter(v => set.has(v.handle))
      .sort((a, b) => (b.hn.last_rec || "").localeCompare(a.hn.last_rec || "") || b.score - a.score);
    if (!items.length) {
      feed.innerHTML = emptyState("Welcome to your timeline", "Follow channels and their posts show up here, newest HN recommendations first.",
        `<a class="btn accent" href="/explore?tab=channels">Find channels to follow</a>`);
      return;
    }
    return infinite(feed, items, v => post(v, { ctx: v.hn.last_rec ? { kind: "recent", text: `Recommended on HN ${ym(v.hn.last_rec)}` } : null }));
  }
  // coming back (browser Back) keeps the same timeline and scroll; a fresh visit rebuilds it if likes changed
  const key = [seed, likes.join(), dislikes.join(), follows.join()].join("|");
  if (!homeCache || (homeCache.key !== key && !popping)) {
    feed.innerHTML = `<div class="status"><span class="spinner"></span></div>`;
    homeCache = { key, items: await buildForYou(), shown: 0, scroll: 0 };
    feed.innerHTML = "";
  }
  const restore = popping && homeCache.shown;
  infinite(feed, homeCache.items, ({ v, ctx }) => post(v, { ctx }), 20, restore ? homeCache.shown : 0);
  if (restore) requestAnimationFrame(() => scrollTo(0, homeCache.scroll));
}

async function status(vid) {
  const v = DB.byVid.get(vid);
  if (!v) return notFound();
  document.title = `${v.channel} on Hackerwitter: “${v.title}”`;
  markSeen(vid);
  const c = channelOf(v);
  const hn = v.hn;
  view.innerHTML = `${head("Post")}<article class="focus" data-vid="${v.vid}">
      <div class="top"><a href="/@${v.handle}">${avatar(v.channel)}</a><div class="pbody phd">
        <a class="name" href="/@${v.handle}">${esc(v.channel)}${badge(c)}</a><span class="handle">@${esc(v.handle)}</span></div>
        ${followBtn(v.handle)}<button class="more" style="margin:0 -8px 0 4px" data-act="more" data-vid="${v.vid}" aria-label="More">${I("more")}</button></div>
      <p class="ptext">${esc(v.title)}</p>
      ${media(v, { lazy: false })}
      <p class="summary">${esc(v.summary)}</p>
      <p class="why">${esc(v.why)}</p>
      <ul class="whys" id="whys"></ul>
      <p class="ptext" style="font-size:15px;margin-top:12px">${v.tags.map(t => `<a class="ht" href="/search/${encodeURIComponent(t)}">#${esc(t.replace(/[^\p{L}\p{N}]+/gu, ""))}</a>`).join(" ")}</p>
      <div class="chips">${v.cats.map(id => DB.cats.get(id)).filter(Boolean).map(c => `<a class="chip" href="/c/${c.id}">${esc(c.name)}</a>`).join("")}</div>
      <div class="stamp">${[v.published ? `Uploaded ${dateLong(v.published)}` : "", v.views != null ? `<b>${compact(v.views)}</b> Views` : "",
        v.duration_s ? dur(v.duration_s) : "", esc(v.type), esc(v.shelf)].filter(Boolean).join(" · ")}</div>
      <div class="counts"><span><b>${fmt(hn.recommenders)}</b> HN recommenders</span><span><b>${fmt(hn.rec_months)}</b> months recommended</span>
        <span><b>${fmt(hn.strong)}</b> strong recs</span><span>On HN <b>${hn.first}–${hn.last}</b></span></div>
      ${actions(v, true)}
      <div class="filterline" style="border:0;padding:12px 0"><a class="chip" href="https://www.youtube.com/watch?v=${v.vid}" target="_blank" rel="noopener">${I("ext")}Watch on YouTube</a></div>
    </article>
    <div id="replies"><div class="status"><span class="spinner"></span></div></div>
    <div id="discover"></div>`;
  sidebar("status", { html: `<section class="card"><h3>Relevant people</h3>${channelRow(c, true)}</section>
    <section class="card"><h3>Up next</h3><div id="upnext"><div class="status"><span class="spinner"></span></div></div></section>`, excludeHandles: [v.handle] });
  const d = await detail(vid);
  if (location.pathname !== `/status/${vid}`) return;
  $("#whys").innerHTML = d.whys.slice(0, 5).map(w => `<li>${esc(w)}</li>`).join("");
  $("#replies").innerHTML = `<div class="repliesh">${plural(d.comments.length, "reply")} from Hacker News</div>` + d.comments.map(m => replyHTML(m, v)).join("");
  // up next: what the same HN people also recommend, then the nearest videos by topic
  const seenUp = new Set([vid]), up = [];
  const co = d.hn_related.map(([id]) => id), sim = d.similar;
  for (let i = 0; up.length < 20 && (i < co.length || i < sim.length); i++)
    for (const id of [co[i], sim[i]]) { const x = id && DB.byVid.get(id); if (x && !seenUp.has(id)) { seenUp.add(id); up.push(x); } }
  const upHTML = up.map(nextRow).join("") || `<div class="status">Nothing yet.</div>`;
  if ($("#upnext")) $("#upnext").innerHTML = upHTML;
  $("#discover").innerHTML = matchMedia("(max-width: 1000px)").matches ? `<div class="sec">Discover more</div><div class="secsub">HN people who recommend this also recommend</div>${upHTML}` : "";
}

// a list of videos with filters: categories, areas, all posts, Longs
function listing({ title, sub = "", path, base, extraTop = "", listing: isListing = true, docTitle }) {
  const params = filterParams();
  document.title = `${docTitle || title} / Hackerwitter`;
  const items = applyFilters(base, params);
  view.innerHTML = head(title, sub) + extraTop + filterLine(path, params, isListing) + `<div id="feed"></div>`;
  sidebar("filters", { filters: filterPanel(path, params, isListing) });
  const feed = $("#feed");
  if (!items.length) feed.innerHTML = `<div class="status">${filtering(params) ? "No posts match these filters." : "Nothing here yet."}</div>`;
  else infinite(feed, items, v => post(v));
}

function category(id) {
  const c = DB.cats.get(id);
  if (!c) return notFound();
  listing({ title: c.name, sub: `${c.area_name} · ${fmt(c.count)} posts`, path: `/c/${id}`, base: DB.videos.filter(v => v.cats.includes(id)) });
}
function area(id) {
  const a = DB.areas.find(x => x.id === id);
  if (!a) return notFound();
  listing({ title: a.name, sub: `${fmt(a.count)} posts`, path: `/a/${id}`, base: DB.videos.filter(v => v.cats.some(c => DB.cats.get(c)?.area === id)),
    extraTop: `<div class="quick">${a.categories.map(c => `<a class="chip" href="/c/${c.id}">${esc(c.name)}</a>`).join("")}</div>` });
}
function browse() {
  const p = filterParams();
  if (p.dur === "xlong") {
    if (!hasMeta) {
      document.title = "Longs / Hackerwitter";
      view.innerHTML = head("Longs", "Every video over an hour") + emptyState("Longs need durations",
        "Durations come from the YouTube Data API, which can't be redistributed. Deploy with a YOUTUBE_API_KEY and Longs light up: every video over an hour, the opposite of Shorts.",
        `<a class="btn accent" href="/data">How to add it</a>`);
      sidebar("home");
      return;
    }
    return listing({ title: "Longs", sub: "Every video over an hour. The opposite of Shorts.", path: "/browse", base: DB.videos });
  }
  listing({ title: "All posts", sub: `${fmt(DB.videos.length)} videos HN recommends`, path: "/browse", base: DB.videos, docTitle: "All posts" });
}

function searchPage(q) {
  const params = filterParams();
  document.title = `${q} - Search / Hackerwitter`;
  const path = `/search/${encodeURIComponent(q)}`;
  const { results, weak } = search(q);
  const list = applyFilters(results, params, r => r.v);
  const t = (sort) => withParams(path, { ...params, sort });
  view.innerHTML = `<div class="head"><div class="bar"><button class="back" data-act="back" aria-label="Back">${I("back")}</button>
      <div style="flex:1;min-width:0">${searchBox(q)}</div></div>
      ${tabs([[t(""), "Top", ""], [t("recent"), "Latest", "recent"], [t("hn"), "Most recommended", "hn"]], params.sort || "")}</div>
    ${filterLine(path, params, false)}
    ${weak && list.length ? `<div class="status" style="padding:16px">No strong matches for “${esc(q)}”. Here are the closest posts.</div>` : ""}
    <div id="feed"></div>`;
  sidebar("filters", { filters: filterPanel(path, params, false), q });
  const feed = $("#feed");
  if (!list.length) feed.innerHTML = emptyState(`No results for “${q}”`, filtering(params) ? "Try removing some filters." : "Try searching for something else, like a topic: “distributed systems”.");
  else infinite(feed, list, r => post(r.v, { ctx: r.via ? { kind: "topic", text: `Topic match · ${r.via}` } : null }));
}

function explore() {
  const tab = new URLSearchParams(location.search).get("tab") === "channels" ? "channels" : "topics";
  document.title = "Explore / Hackerwitter";
  view.innerHTML = `<div class="head"><div class="bar" style="padding:6px 16px"><div style="flex:1">${searchBox()}</div></div>
    ${tabs([["/explore", "Topics", "topics"], ["/explore?tab=channels", "Channels", "channels"]], tab)}</div><div id="ex"></div>`;
  sidebar(tab === "channels" ? "explore-channels" : "explore");
  const ex = $("#ex");
  if (tab === "channels") {
    const top = [...DB.channels.values()].sort((a, b) => b.score - a.score);
    ex.innerHTML = `<div class="sec">Channels HN recommends</div><div class="secsub">Ranked by how often, and for how long, HN has recommended their videos.</div>`;
    const list = document.createElement("div"); ex.append(list);
    return infinite(list, top, c => channelRow(c, true), 30);
  }
  ex.innerHTML = `<div class="quick">
      <a class="chip" href="/browse?sort=recent">Recently recommended</a><a class="chip" href="/browse?dur=xlong">Longs</a>
      <a class="chip" href="/browse?gems=1">Hidden gems</a><a class="chip" href="/browse">All posts</a><a class="chip" href="/lists">Lists</a></div>
    ${DB.areas.map(a => `<div class="sec" style="padding-top:20px"><a href="/a/${a.id}">${esc(a.name)}</a></div>
      ${a.categories.slice(0, 4).map(c => `<a class="trend" href="/c/${c.id}"><div class="k">${esc(a.name)} · Trending</div><b>${esc(c.name)}</b><div class="n">${fmt(c.count)} posts</div></a>`).join("")}
      <a class="trend link" href="/a/${a.id}">Show all ${a.categories.length} topics</a><div class="divider"></div>`).join("")}`;
}

function profile(handle) {
  const c = DB.channels.get(handle);
  if (!c) return notFound();
  const tab = new URLSearchParams(location.search).get("tab") === "latest" ? "latest" : "posts";
  document.title = `${c.channel} (@${c.handle}) / Hackerwitter`;
  const top = Object.entries(c.cats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => DB.cats.get(id)).filter(Boolean);
  const vids = tab === "latest" ? c.vids.slice().sort((a, b) => (b.hn.last_rec || "").localeCompare(a.hn.last_rec || "")) : c.vids;
  view.innerHTML = head(c.channel, plural(c.vids.length, "post")) + `
    <div class="banner">${c.vids.slice(0, 4).map(v => img(v.vid, false)).join("")}</div>
    <div class="pinfo"><div class="avrow">${avatar(c.channel, "xl")}${followBtn(c.handle, false)}</div>
      <h1>${esc(c.channel)}${badge(c)}</h1><div class="handle">@${esc(c.handle)}</div>
      <p class="bio">On YouTube. ${esc(plural(c.vids.length, "video"))} Hacker News keeps recommending${top.length ? `, about ${top.map(x => `<a class="link" href="/c/${x.id}">${esc(x.name)}</a>`).join(", ")}` : ""}.</p>
      <div class="meta"><span>On HN since ${c.first}</span><a class="link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(c.channel)}" target="_blank" rel="noopener">youtube.com</a></div>
      <div class="meta"><span><b>${fmt(c.recommenders)}</b> HN recommenders</span><span><b>${fmt(c.months)}</b> months recommended</span></div></div>
    <div class="head" style="position:static">${tabs([[`/@${c.handle}`, "Posts", "posts"], [`/@${c.handle}?tab=latest`, "Latest", "latest"]], tab)}</div><div id="feed"></div>`;
  sidebar("profile", { excludeHandles: [c.handle] });
  infinite($("#feed"), vids, v => post(v, { ctx: tab === "latest" && v.hn.last_rec ? { kind: "recent", text: `Recommended on HN ${ym(v.hn.last_rec)}` } : null }));
}

function listsPage() {
  document.title = "Lists / Hackerwitter";
  const row = (p) => `<a class="row" href="/lists/${p.slug}"><div class="lthumb">${img(p.videos[0]?.vid)}</div>
    <div class="rb"><b>${esc(p.title)}</b><div class="muted">Curated by Claude · ${p.videos.length} videos · ${hours(p.minutes)}</div><p>${esc(p.pitch)}</p></div></a>`;
  view.innerHTML = head("Lists", "Curated by Claude from what Hacker News recommends") +
    [["start", "Start here", "Broad, essential lists for your first visit."], ["deep", "Deep dives", "One obsession each, for when you want to go down a rabbit hole."]]
      .map(([tier, title, blurb]) => { const ps = DB.playlists.filter(p => (p.tier || "deep") === tier);
        return ps.length ? `<div class="sec" style="padding-top:16px">${title}</div><div class="secsub">${blurb}</div>${ps.map(row).join("")}<div class="divider"></div>` : ""; }).join("");
  sidebar("home");
}
function listPage(slug) {
  const p = DB.playlists.find(x => x.slug === slug);
  if (!p) return notFound();
  document.title = `${p.title} / Hackerwitter`;
  const items = p.videos.map(x => [DB.byVid.get(x.vid), x.note]).filter(([v]) => v);
  view.innerHTML = head(p.title, "Curated by Claude") + `<div class="listhead">
      <div class="banner">${items.slice(0, 4).map(([v]) => img(v.vid, false)).join("")}</div>
      <h1>${esc(p.title)}</h1>
      <div class="by"><span class="av sm" style="background:#d97757">C</span><b>Claude</b><span class="muted">@claude</span></div>
      <p>${esc(p.intro)}</p>
      <div class="by" style="margin-bottom:12px">${items.length} videos · ${hours(p.minutes)}</div>
      <div class="btns">${playAll()}</div></div><div id="feed"></div>`;
  sidebar("home");
  $("#feed").innerHTML = items.map(([v, note], i) => post(v, { note, ctx: { kind: "playlist", text: `${i + 1} of ${items.length} in ${p.title}` } })).join("");
}

function savedPage(title, ids, emptyTitle, emptyText, extra = "") {
  document.title = `${title} / Hackerwitter`;
  const items = ids.slice().reverse().map(id => DB.byVid.get(id)).filter(Boolean);
  view.innerHTML = head(title, items.length ? plural(items.length, "post") : "") +
    (items.length ? `<div class="filterline"><span class="grow"></span>${extra}${playAll()}</div>` : "") + `<div id="feed"></div>`;
  sidebar("home");
  if (!items.length) $("#feed").innerHTML = emptyState(emptyTitle, emptyText);
  else infinite($("#feed"), items, v => post(v));
}
const bookmarksPage = () => savedPage("Bookmarks", bookmarks, "Save posts for later", "Bookmark posts to easily find them again in the future. HackerTube calls this Watch later.");
const likesPage = () => savedPage("Likes", likes, "You don’t have any likes yet", "Tap the heart on any post to show it some love. Likes steer your For you timeline.");
const historyPage = () => savedPage("History", seen, "Nothing here yet", "Posts you open show up here.", `<button class="chip" data-act="clearhistory">Clear all watch history</button>`);

function settingsPage() {
  document.title = "Settings / Hackerwitter";
  const theme = document.documentElement.dataset.theme, accent = document.documentElement.dataset.accent || "blue";
  const ACCENTS = [["blue", "#1d9bf0"], ["yellow", "#ffd400"], ["pink", "#f91880"], ["purple", "#7856ff"], ["orange", "#ff7a00"], ["green", "#00ba7c"]];
  view.innerHTML = head("Settings") + `<div class="setgroup">
    <h3>Display</h3>
    <p class="secsub" style="margin:0">Manage your color and background. These settings affect only this browser.</p>
    <div class="sec" style="font-size:15px">Color</div>
    <div class="swatches">${ACCENTS.map(([k, c]) => `<button class="sw${accent === k ? " on" : ""}" style="background:${c}" data-act="accent" data-v="${k}" aria-label="${k}">${I("check")}</button>`).join("")}</div>
    <div class="sec" style="font-size:15px">Background</div>
    <div class="themes">${[["light", "Default", "#fff", "#0f1419"], ["dim", "Dim", "#15202b", "#f7f9f9"], ["dark", "Lights out", "#000", "#e7e9ea"]].map(([k, l, bg, fg]) =>
      `<button class="${theme === k ? "on" : ""}" style="background:${bg};color:${fg};border-color:${theme === k ? "" : "var(--line2)"}" data-act="theme" data-v="${k}"><span class="radio"></span>${l}</button>`).join("")}</div>
    <div class="divider"></div>
    <h3>Video</h3>
    <label class="setting"><div><b>Show video frames instead of thumbnails</b>
      <p>YouTube thumbnails are designed by uploaders to grab your attention: big faces, arrows, shouting text. With this on, every post shows a
      frame from the middle of the video instead, so you see what it actually looks like. Turn it off to see the original thumbnails.</p></div>
      <span class="check"><input type="checkbox" id="frames-toggle" ${useFrames ? "checked" : ""}><span></span></span></label>
    <div class="divider"></div>
    <h3>Your data</h3>
    <div class="setting" style="cursor:default"><div><b>Stored only in this browser</b>
      <p>There are no accounts. ${plural(likes.length, "like")}, ${plural(bookmarks.length, "bookmark")}, ${fmt(follows.length)} follows and
      ${plural(seen.length, "post")} of history live in localStorage.</p></div>
      <button class="btn sm ghost" data-act="wipe" style="color:var(--like)">Clear all</button></div>
  </div>`;
  $("#frames-toggle").onchange = (e) => { useFrames = e.target.checked; store.set("frames", useFrames); toast(useFrames ? "Showing video frames" : "Showing original thumbnails"); };
  sidebar("home");
}

function about() {
  document.title = "About / Hackerwitter";
  const s = DB.stats;
  view.innerHTML = head("About") + `<article class="about">
    <h1>Hackerwitter</h1>
    <p class="lede">The YouTube videos that Hacker News keeps telling each other to watch, as a timeline.</p>
    <div class="stats">
      <div class="stat"><b>${fmt(DB.videos.length)}</b><span>videos</span></div>
      <div class="stat"><b>${fmt(s.comments)}</b><span>HN comments read</span></div>
      <div class="stat"><b>${fmt(s.categories)}</b><span>topics in ${s.areas} areas</span></div>
      <div class="stat"><b>${s.first_year}–${s.last_year}</b><span>years of HN</span></div>
    </div>
    <h2>Why</h2>
    <p>Feeds are tuned for engagement. They're very good at finding the next thing you'll click, and not so good at finding the talk you'll
      still be thinking about next year.</p>
    <p>Meanwhile, for nearly two decades, Hacker News commenters have been pointing each other at exactly those videos: the conference talk that
      changed how someone writes software, the lecture series that finally made a subject click, the documentary nobody else seems to know about.
      <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a> collected them and made them browsable as a calm YouTube.
      Hackerwitter is the same collection, the same comments and the same lists, as a timeline: every video is a post by its channel, every HN
      comment about it is a reply.</p>
    <h2>How it was built</h2>
    <ol class="steps">
      <li><b>Read all of Hacker News.</b> Every comment from ${s.first_year} to ${s.last_year} (from a public dataset of the full HN archive) was
        scanned for YouTube links. That turns up well over a hundred thousand different videos.</li>
      <li><b>Keep the videos HN keeps coming back to.</b> A video makes the cut if at least three different people linked it with some real
        commentary, in at least three different months. One-off links and pure drive-bys fall away.</li>
      <li><b>Read each comment with an AI model.</b> A link isn't always a recommendation. Claude read each comment, along with the title of the HN
        story it was posted under, and judged what the commenter was doing: recommending the video, citing it, joking, or criticizing it.</li>
      <li><b>Write a card for every video.</b> A short summary, why HN people like it, what kind of video it is, and whether it has aged well.
        Videos are sorted into a shared list of topics.</li>
      <li><b>Rank by lasting recommendations.</b> A video's standing comes from how many separate months people recommended it in. Being linked
        again and again over the years counts for more than one viral spike.</li>
    </ol>
    <h2>How it maps to a timeline</h2>
    <ul>
      <li><b>Posts</b> are videos, posted by their channel. The quoted post is HN's best pull quote about it.</li>
      <li><b>Replies</b> are the real Hacker News comments, with links back to the threads. 💬 counts them, 🔁 counts the distinct HN people who recommended it.</li>
      <li><b>For you</b> mixes HN classics, hidden gems, recent favorites, topics you haven't explored yet, and, once you like a few posts, similar
        ones and ones the same HN people also recommended. The line above each post says why it's there.</li>
      <li><b>Following</b>: follow channels and their posts show up there. <b>Bookmarks</b> are Watch later. <b>Lists</b> are the playlists
        Claude curated for HackerTube. <b>Explore</b> has every topic and channel.</li>
      <li><b>Search</b> understands topics, not just keywords: it also matches the synonym-rich topic descriptions.</li>
      <li><b>Keyboard shortcuts:</b> press <kbd>?</kbd> to see them all, e.g. <kbd>/</kbd> to search and <kbd>j</kbd>/<kbd>k</kbd> to move through posts.</li>
    </ul>
    <h2>Privacy</h2>
    <p>There are no accounts. Your likes, follows, history and bookmarks are stored only in this browser. Videos play through YouTube's
      privacy-enhanced embed.</p>
    <h2>Credits</h2>
    <p>The data, the comment labels, video cards, topic list and playlists are from <a href="https://hackertube.org" target="_blank" rel="noopener">HackerTube</a>,
      built by Claude Opus 5.5 in Claude Code and prompted into existence by <a href="https://x.com/karpathy" target="_blank" rel="noopener">@karpathy</a>,
      released under ODC-By 1.0. Hackerwitter was built from that one zip file by Claude Opus 5.5 in Claude Code too.
      Source on <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
    <p class="fine">Hackerwitter is an independent project. It is not affiliated with X, YouTube, Google, Hacker News or Y Combinator.
      Comments come from the public Hacker News archive${hasMeta ? "; video details from the YouTube Data API" : ""}.</p>
  </article>`;
  sidebar("home");
}

function dataPage() {
  document.title = "Data / Hackerwitter";
  view.innerHTML = head("Data") + `<article class="about">
    <h1>The data</h1>
    <p class="lede">Everything behind Hackerwitter, free to reuse. Give it to your AI agent and build your own.</p>
    <p><a class="btn accent" href="https://hackertube.org/data" target="_blank" rel="noopener">${I("download")}Download the HackerTube data</a></p>
    <p>${fmt(DB.videos.length)} videos and ${fmt(DB.stats.comments)} labeled Hacker News comments, from HackerTube's export: <code>videos.jsonl</code>,
      <code>mentions.jsonl</code>, <code>taxonomy.json</code>, <code>related.jsonl</code>, <code>embeddings.npy</code> and a <code>DATA.md</code> written for agents.</p>
    <h2>Give it to your agent</h2>
    <p>Unzip it, open Claude Code in that folder and tell it what to build. This site was made exactly that way, with a prompt like:</p>
    <pre class="prompt" id="agent-prompt">Read DATA.md in this folder. Using this data, build me the same thing as
HackerTube, but make it feel like X instead of YouTube: videos are posts by
their channel, HN comments are replies, a For you timeline that learns from
my likes, Explore, Lists, Bookmarks, no logins. Then deploy it on Vercel.</pre>
    <p><button class="btn sm ghost" data-act="copyprompt">Copy this prompt</button></p>
    <h2>How this site uses it</h2>
    <p><code>scripts/build_data.py</code> turns the export into static JSON: one compact file with every video for the timeline and search, and one
      small file per video with its HN replies, "HN people also recommend" and the 20 nearest videos by embedding. No server, no database.</p>
    <h2>YouTube details</h2>
    <p>Durations, view counts and upload dates aren't in the export, because YouTube's API terms don't allow redistributing them.
      ${hasMeta ? "This deployment fetches them at build time with a YouTube Data API key." : `This deployment doesn't have them yet. Set a free
      <code>YOUTUBE_API_KEY</code> on the Vercel project and redeploy: <code>scripts/fetch_meta.mjs</code> fetches them at build time in about
      ${Math.ceil(DB.videos.length / 50)} requests, and Longs, durations, views and upload-date filters light up.`}</p>
    <h2>License</h2>
    <p><a href="https://opendatacommons.org/licenses/by/1-0/" target="_blank" rel="noopener">ODC-By 1.0</a>, like the Hacker News archive it's
      derived from: credit HackerTube and the <a href="https://huggingface.co/datasets/open-index/hacker-news" target="_blank" rel="noopener">open-index/hacker-news</a>
      dataset. Comments remain the work of their authors. The labels, summaries and cards were written by Claude, so expect a few to be off.</p>
  </article>`;
  sidebar("home");
}

function notFound() {
  document.title = "Page not found / Hackerwitter";
  view.innerHTML = head("") + emptyState("Hmm...this page doesn’t exist.", "Try searching for something else.", `<a class="btn accent" href="/explore">Search</a>`);
  sidebar("home");
}

// ---------- chrome: left nav, mobile bars, drawer ----------
const NAV = [
  ["/", "Home", "home", "homeO"], ["/explore", "Explore", "search"], ["/browse?dur=xlong", "Longs", "longs"], ["/lists", "Lists", "list"],
  ["/bookmarks", "Bookmarks", "bmOn", "bm"], ["/likes", "Likes", "heartOn", "heart"], ["/history", "History", "history"],
  ["/settings", "Settings", "settings"], ["/about", "About", "info"],
];
const meBox = () => `<a class="me" href="/settings" title="Settings">${`<span class="av me-av">${I("person")}</span>`}
  <div class="who"><b>You</b><div class="muted">@anonymous · no login</div></div></a>`;
function chrome() {
  const here = location.pathname + location.search;
  const on = (href) => href === "/" ? ["/", "/following"].includes(location.pathname)
    : href.includes("?") ? here === href : location.pathname === href || location.pathname.startsWith(href + "/");
  $("#nav").innerHTML = `<a class="logo" href="/" aria-label="Hackerwitter">${LOGO}</a>
    ${NAV.map(([href, label, icOn, icOff]) => `<a class="navlink${on(href) ? " on" : ""}" href="${href}" title="${label}"><span>${I(on(href) || !icOff ? icOn : icOff)}<b class="lbl" style="font-weight:inherit">${label}</b></span></a>`).join("")}
    <button class="postbtn" data-act="surprise" title="Open a random post HN loves">${I("shuffle")}<span>Surprise me</span></button>
    ${meBox()}`;
  const isHome = location.pathname === "/" || location.pathname === "/following";
  $("#mtop").className = "mtop" + (isHome ? "" : " hidden");
  $("#mtop").innerHTML = `<button data-act="drawer" aria-label="Menu"><span class="av me-av">${I("person")}</span></button>
    <a class="logo" href="/" aria-label="Hackerwitter">${LOGO}</a><a href="/settings" aria-label="Settings" style="width:32px;display:grid;place-items:center">${I("settings")}</a>`;
  const TAB = [["/", "Home", "home", "homeO"], ["/explore", "Explore", "search"], ["/browse?dur=xlong", "Longs", "longs"], ["/lists", "Lists", "list"], ["/bookmarks", "Bookmarks", "bmOn", "bm"]];
  $("#tabbar").innerHTML = TAB.map(([href, label, icOn, icOff]) => `<a href="${href}" class="${on(href) ? "on" : ""}" aria-label="${label}">${I(on(href) || !icOff ? icOn : icOff)}</a>`).join("");
  $("#drawer").innerHTML = `<div class="scrim" data-act="drawer"></div><div class="panel"><div class="dme"><span class="av me-av lg">${I("person")}</span>
    <b>You</b><span class="muted">@anonymous · no login</span></div>
    ${NAV.map(([href, label, ic]) => `<a href="${href}">${I(ic)}${label}</a>`).join("")}<a href="/data">${I("download")}Data</a></div>`;
}

// ---------- router ----------
let popping = false, navigated = false;   // navigated: there is an in-app page to go Back to
function navigate(path) {
  if (path !== location.pathname + location.search) {
    navigated = true;
    rememberHome();
    history.pushState(null, "", path);
  }
  route();
}
function rememberHome() {
  const f = $("#feed");
  if (homeCache && location.pathname === "/" && f) { homeCache.shown = +f.dataset.shown || 0; homeCache.scroll = scrollY; }
}
async function route() {
  const path = location.pathname;
  const [, page = "", ...rest] = path.split("/");
  const arg = decodeURIComponent(rest.join("/"));
  if (page === "watch" && arg) { history.replaceState(null, "", `/status/${arg}`); return route(); }
  if (page === "longs") { history.replaceState(null, "", "/browse?dur=xlong"); return route(); }
  if (pager) { pager.disconnect(); pager = null; }
  closeMenu(); $("#drawer").classList.remove("on"); $("#modal").classList.remove("on");
  selected = -1;
  chrome();
  try {
    if (!page) await home("foryou");
    else if (page === "following") await home("following");
    else if (page === "status") await status(arg);
    else if (page.startsWith("@")) profile(decodeURIComponent(page.slice(1)));
    else if (page === "explore") explore();
    else if (page === "search") arg ? searchPage(arg) : navigate("/explore");
    else if (page === "c") category(arg);
    else if (page === "a") area(arg);
    else if (page === "browse") browse();
    else if (page === "lists") arg ? listPage(arg) : listsPage();
    else if (page === "bookmarks") bookmarksPage();
    else if (page === "likes") likesPage();
    else if (page === "history") historyPage();
    else if (page === "settings") settingsPage();
    else if (page === "about") about();
    else if (page === "data") dataPage();
    else notFound();
  } catch (e) { console.error(e); view.innerHTML = `<div class="status">Something went wrong (${esc(e.message)}).</div>`; }
  if (!(popping && (path === "/"))) scrollTo(0, 0);
  popping = false;
}
addEventListener("popstate", () => { popping = true; route(); });

// ---------- interactions ----------
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 2000);
}
function refreshActs(vid) {
  const v = DB.byVid.get(vid);
  for (const el of $$(`[data-vid="${vid}"] .acts`)) el.outerHTML = actions(v, el.classList.contains("wide"));
}
function like(vid) {
  const on = toggleIn(likes, vid);
  if (on) dislikes = dislikes.filter(x => x !== vid);
  saveVotes(); refreshActs(vid);
  return on;
}
function bookmark(vid) {
  const on = toggleIn(bookmarks, vid); store.set("later", bookmarks); refreshActs(vid);
  toast(on ? "Added to your Bookmarks" : "Removed from your Bookmarks");
  if (!on && location.pathname === "/bookmarks") bookmarksPage();
}
function follow(handle) {
  const on = toggleIn(follows, handle); store.set("follows", follows);
  for (const b of $$(`[data-act="follow"][data-handle="${CSS.escape(handle)}"]`)) b.outerHTML = followBtn(handle, b.classList.contains("sm"));
  toast(on ? `Following @${handle}` : `Unfollowed @${handle}`);
}
async function copy(text, msg = "Copied to clipboard") {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { prompt("Copy this:", text); }
}
function play(frame) {
  const v = DB.byVid.get(frame.dataset.play);
  if (!v || frame.querySelector("iframe")) return;
  // one player at a time, like a timeline
  for (const f of $$(".frame iframe")) { const p = f.parentElement; p.innerHTML = `${img(p.dataset.play)}<span class="play">${I("play")}</span>`; }
  frame.innerHTML = embed(v);
  markSeen(v.vid);
}
function closeMenu() { $(".menu")?.remove(); }
function openMenu(btn) {
  closeMenu();
  const v = DB.byVid.get(btn.dataset.vid);
  const dis = dislikes.includes(v.vid), fol = follows.includes(v.handle);
  const m = document.createElement("div");
  m.className = "menu";
  m.innerHTML = `<button data-act="dislike" data-vid="${v.vid}">${I("block")}${dis ? "Undo: not interested" : "Not interested in this post"}</button>
    <button data-act="follow" data-handle="${esc(v.handle)}" data-menu="1">${I("person")}${fol ? "Unfollow" : "Follow"} @${esc(v.handle)}</button>
    <a href="https://www.youtube.com/watch?v=${v.vid}" target="_blank" rel="noopener">${I("ext")}Watch on YouTube</a>
    ${v.quote ? `<a href="https://news.ycombinator.com/item?id=${v.quote.id}" target="_blank" rel="noopener">${I("reply")}View the quote on Hacker News</a>` : ""}
    <button data-act="share" data-vid="${v.vid}">${I("link")}Copy link</button>`;
  document.body.append(m);
  const r = btn.getBoundingClientRect();
  m.style.top = `${scrollY + r.top}px`;
  m.style.left = `${Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth))}px`;
}
function wirePlayAll(a) {
  const ids = [...new Set($$("#view [data-vid]").map(el => el.dataset.vid))].slice(0, 50);
  if (!ids.length) return false;
  a.href = `https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`;
  return true;
}
function surprise() {
  const pool = DB.videos.filter(v => v.hn.recommenders >= 3 && v.shelf !== "news" && !seen.includes(v.vid));
  const v = pool[Math.floor(Math.random() * Math.min(pool.length, 1500))];
  if (v) navigate(`/status/${v.vid}`);
}

document.addEventListener("click", async (e) => {
  const t = e.target instanceof Element ? e.target : null;
  if (!t) return;
  if (!t.closest(".menu") && !t.closest('[data-act="more"]')) closeMenu();
  const actEl = t.closest("[data-act]");
  if (actEl && actEl.tagName !== "FORM") {
    const act = actEl.dataset.act, vid = actEl.dataset.vid;
    if (act === "playall") { if (!wirePlayAll(actEl)) e.preventDefault(); return; }
    e.preventDefault(); e.stopPropagation();
    if (act === "like") { const on = like(vid); if (on) toast("Liked. Your For you timeline will show more like this."); }
    else if (act === "bm") bookmark(vid);
    else if (act === "share") { closeMenu(); copy(`${location.origin}/status/${vid}`); }
    else if (act === "more") { $(".menu") ? closeMenu() : openMenu(actEl); }
    else if (act === "dislike") {
      const on = toggleIn(dislikes, vid); if (on) likes = likes.filter(x => x !== vid);
      saveVotes(); closeMenu(); refreshActs(vid);
      toast(on ? "Thanks. You’ll see fewer posts like this." : "Undone");
      if (on && location.pathname === "/") $(`.post[data-vid="${vid}"]`)?.remove();
    }
    else if (act === "follow") { closeMenu(); follow(actEl.dataset.handle); }
    else if (act === "back") { navigated ? history.back() : navigate("/"); }
    else if (act === "filters") { $(".inlinefilters")?.classList.toggle("open"); }
    else if (act === "surprise") surprise();
    else if (act === "drawer") $("#drawer").classList.toggle("on");
    else if (act === "help") toggleHelp(true);
    else if (act === "theme") { document.documentElement.dataset.theme = actEl.dataset.v; store.set("theme", actEl.dataset.v); settingsPage(); }
    else if (act === "accent") { const a = actEl.dataset.v; if (a === "blue") delete document.documentElement.dataset.accent; else document.documentElement.dataset.accent = a; store.set("accent", a === "blue" ? null : a); settingsPage(); }
    else if (act === "clearhistory") { seen = []; store.set("seen", seen); historyPage(); }
    else if (act === "wipe") { if (confirm("Clear likes, bookmarks, follows and history from this browser?")) {
      likes = []; dislikes = []; seen = []; bookmarks = []; follows = [];
      for (const k of ["likes", "dislikes", "seen", "later", "follows"]) store.set(k, []); homeCache = null; settingsPage(); toast("Cleared"); } }
    else if (act === "copyprompt") copy($("#agent-prompt").textContent, "Prompt copied");
    return;
  }
  const frame = t.closest(".frame[data-play]");
  if (frame) { e.preventDefault(); play(frame); return; }
  // whole post is clickable, except its links, buttons and the player
  const a = t.closest("a[href]");
  if (!a) {
    const p = t.closest(".post[data-href]");
    if (p && !getSelection().toString()) { navigate(p.dataset.href); return; }
    return;
  }
  const href = a.getAttribute("href");
  if (!href.startsWith("/") || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (href === "#") return;
  navigate(href);
}, true);

document.addEventListener("submit", (e) => {
  const f = e.target.closest('[data-act="search"]');
  if (!f) return;
  e.preventDefault();
  const q = f.q.value.trim();
  f.q.blur();
  // filters chosen on a search page carry over into the next search
  if (q) navigate(withParams(`/search/${encodeURIComponent(q)}`, location.pathname.startsWith("/search/") ? filterParams() : {}));
});

// ---------- keyboard shortcuts ----------
let selected = -1;
const listItems = () => $$("#view .post[data-vid], #view .next, #side .next");
function select(i) {
  const list = listItems();
  if (!list.length) return;
  selected = Math.max(0, Math.min(i, list.length - 1));
  list.forEach((el, j) => el.classList.toggle("kbd", j === selected));
  list[selected].scrollIntoView({ block: "center", behavior: "smooth" });
}
const SHORTCUTS = [["/", "Search"], ["j / k", "Next / previous post"], ["Enter / o", "Open the selected post"],
  ["l", "Like the selected or current post"], ["b / w", "Bookmark the selected or current post"], ["p", "Play the selected or current video"],
  ["s", "Surprise me"], ["h", "Home"], ["e", "Explore"], ["?", "Show these shortcuts"], ["Esc", "Close / leave the search box"]];
function toggleHelp(force) {
  const h = $("#modal");
  const show = force ?? !h.classList.contains("on");
  h.innerHTML = `<div class="mcard" role="dialog" aria-label="Keyboard shortcuts"><h3>Keyboard shortcuts</h3>
    <table>${SHORTCUTS.map(([k, d]) => `<tr><td>${k.split(" / ").map(x => `<kbd>${esc(x)}</kbd>`).join(" / ")}</td><td>${esc(d)}</td></tr>`).join("")}</table></div>`;
  h.classList.toggle("on", show);
}
$("#modal").onclick = (e) => { if (e.target.id === "modal") toggleHelp(false); };
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const el = document.activeElement;
  const typing = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  if (e.key === "Escape") { if (typing) el.blur(); toggleHelp(false); closeMenu(); $("#drawer").classList.remove("on"); return; }
  if (typing) return;
  const sel = listItems()[selected];
  const current = location.pathname.startsWith("/status/") ? location.pathname.split("/")[2] : null;
  const target = sel?.dataset.vid || sel?.getAttribute("href")?.split("/").pop() || current;
  const key = e.code === "Slash" && e.shiftKey ? "?" : e.key;
  switch (key) {
    case "/": { e.preventDefault(); const i = $("#view .searchbox input") || $("#side .searchbox input"); if (i) { i.focus(); i.select(); } else navigate("/explore"); break; }
    case "j": select(selected + 1); break;
    case "k": select(selected - 1); break;
    case "Enter": case "o": if (sel) { e.preventDefault(); navigate(sel.dataset.href || sel.getAttribute("href")); } break;
    case "l": if (target) toast(like(target) ? "Liked" : "Removed from Likes"); break;
    case "b": case "w": if (target) bookmark(target); break;
    case "p": { const f = (sel && sel.querySelector(".frame[data-play]")) || $(`#view .focus .frame[data-play]`); if (f) play(f); break; }
    case "s": surprise(); break;
    case "h": navigate("/"); break;
    case "e": navigate("/explore"); break;
    case "?": toggleHelp(); break;
    default: return;
  }
});

// ---------- boot ----------
loadData().then(route).catch((e) => { view.innerHTML = `<div class="status">Couldn't load the data (${esc(e.message)}).</div>`; });
