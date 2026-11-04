# Build the static data files the site reads, from the HackerTube data export.
# Usage: python3 scripts/build_data.py   (downloads the export into data-src/ on first run)
#
# Output, all under public/data/:
#   videos.json     every video, compact, best-scored first (feed, search, filters)
#   taxonomy.json   16 areas, 150 categories, with counts
#   playlists.json  the Claude-curated playlists from HackerTube
#   v/<vid>.json    one file per video: its HN comments, "HN people also recommend", similar videos
import io, json, os, re, shutil, sys, urllib.request, zipfile
from collections import defaultdict

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data-src")
OUT = os.path.join(ROOT, "public", "data")
ZIP_URL = "https://hackertube.org/download/hackertube-data.zip"


def fetch_export():
    if os.path.exists(os.path.join(SRC, "videos.jsonl")):
        return
    print("downloading", ZIP_URL)
    raw = urllib.request.urlopen(ZIP_URL).read()
    os.makedirs(SRC, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        for name in z.namelist():
            if name.endswith("/"):
                continue
            with open(os.path.join(SRC, os.path.basename(name)), "wb") as f:
                f.write(z.read(name))


def jsonl(name):
    with open(os.path.join(SRC, name)) as f:
        return [json.loads(line) for line in f if line.strip()]


def dump(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def handle(channel):
    # "3Blue1Brown" -> "3Blue1Brown", "TEDx Talks" -> "TEDxTalks": a stable @handle for each channel
    h = re.sub(r"[^0-9A-Za-z_]", "", channel)
    return h[:24] or "channel"


def main():
    fetch_export()
    videos = jsonl("videos.jsonl")
    mentions = jsonl("mentions.jsonl")
    related = {r["vid"]: r["related"] for r in jsonl("related.jsonl")}
    taxonomy = json.load(open(os.path.join(SRC, "taxonomy.json")))
    vids = {v["vid"] for v in videos}

    by_vid = defaultdict(list)
    for m in mentions:
        by_vid[m["vid"]].append(m)

    # similar videos from the embeddings: top 20 neighbours by cosine similarity
    emb = np.load(os.path.join(SRC, "embeddings.npy")).astype(np.float32)
    ids = json.load(open(os.path.join(SRC, "embedding_ids.json")))
    sims = emb @ emb.T
    np.fill_diagonal(sims, -1)
    top = np.argsort(-sims, axis=1)[:, :20]
    similar = {ids[i]: [ids[j] for j in top[i]] for i in range(len(ids))}

    # handles must be unique per channel
    handles, taken = {}, {}
    for v in videos:
        c = v["channel"]
        if c in handles:
            continue
        h = handle(c)
        n = taken.get(h.lower(), 0)
        taken[h.lower()] = n + 1
        handles[c] = h if n == 0 else f"{h}{n + 1}"

    cat_count = defaultdict(int)
    out = []
    for v in videos:
        ms = by_vid[v["vid"]]
        recs = sorted(m["month"] for m in ms if m["stance"] in ("rec", "strong_rec"))
        for c in v["categories"]:
            cat_count[c["id"]] += 1
        hn = v["hn"]
        q = v.get("quote") or None
        out.append({
            "vid": v["vid"],
            "title": v["title"],
            "channel": v["channel"],
            "handle": handles[v["channel"]],
            "summary": v["summary"],
            "why": v["why_hn"],
            "type": v["content_type"],
            "level": v["level"],
            "shelf": v["shelf_life"],
            "topic": v["primary_topic"],
            "tags": v["tags"],
            "cats": [c["id"] for c in v["categories"]],
            "quote": {"text": q["text"], "id": q["hn_comment_id"], "year": q["year"]} if q else None,
            "hn": {
                "mentions": hn["mentions"], "recommenders": hn["recommenders"], "rec_months": hn["rec_months"],
                "strong": hn["strong_recs"], "first": hn["first_year"], "last": hn["last_year"],
                "last_rec": recs[-1] if recs else None, "stances": hn["stances"],
            },
            "score": v["score"],
        })

    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "v"))
    dump(os.path.join(OUT, "videos.json"), out)

    areas = []
    for a in taxonomy["areas"]:
        cats = [{"id": c["id"], "name": c["name"], "description": c.get("description", ""), "count": cat_count[c["id"]]}
                for c in a["categories"]]
        cats.sort(key=lambda c: -c["count"])
        areas.append({"id": a["id"], "name": a["name"], "count": len({v["vid"] for v in out if any(c in {x["id"] for x in cats} for c in v["cats"])}), "categories": cats})
    areas.sort(key=lambda a: -a["count"])
    dump(os.path.join(OUT, "taxonomy.json"), areas)

    playlists = json.load(open(os.path.join(ROOT, "scripts", "playlists.json")))
    for p in playlists:
        p["videos"] = [x for x in p["videos"] if x["vid"] in vids]
    dump(os.path.join(OUT, "playlists.json"), playlists)

    stance_rank = {"strong_rec": 0, "rec": 1, "reference": 2, "critical": 3, "joke": 4}
    for v in out:
        # strongest stance first, newest first within a stance, like a reply thread sorted by relevance
        ms = sorted(by_vid[v["vid"]], key=lambda m: (stance_rank.get(m["stance"], 9), -int(m["month"].replace("-", ""))))
        dump(os.path.join(OUT, "v", f"{v['vid']}.json"), {
            "whys": sorted({m["why"] for m in ms if m["why"] and m["stance"] in ("rec", "strong_rec")})[:8],
            "comments": [{"id": m["hn_comment_id"], "author": m["author"], "ym": m["month"], "story": m["story_title"],
                          "stance": m["stance"], "why": m["why"], "text": m["text"]} for m in ms],
            "hn_related": [[r["vid"], r["shared_recommenders"]] for r in related.get(v["vid"], []) if r["vid"] in vids],
            "similar": [s for s in similar.get(v["vid"], []) if s in vids],
        })

    dump(os.path.join(OUT, "stats.json"), {
        "videos": len(out), "comments": len(mentions),
        "recommenders": len({m["author"] for m in mentions if m["stance"] in ("rec", "strong_rec")}),
        "first_year": min(m["month"] for m in mentions)[:4], "last_year": max(m["month"] for m in mentions)[:4],
        "areas": len(areas), "categories": sum(len(a["categories"]) for a in areas), "channels": len(handles),
    })
    print("wrote", len(out), "videos,", len(mentions), "comments")


if __name__ == "__main__":
    sys.exit(main())
