<img src="assets/icon.svg" width="64" height="64" alt="">

# Hackerwitter

The YouTube videos that Hacker News keeps telling each other to watch, as a timeline.

[HackerTube](https://hackertube.org) by [@karpathy](https://x.com/karpathy/status/2116957135661945283) turned 20 years of HN
comments into 6,454 videos people keep recommending, with a calm YouTube-style UI. Hackerwitter is the same content (the same
videos, the same HN comments, the same topics and Claude-curated playlists) with the feel of X:

| HackerTube | Hackerwitter |
|---|---|
| Video | A post by the channel, with HN's best pull quote as the quoted post |
| HN comments under a video | Replies, with stance labels and links back to the HN thread |
| Home | **For you**: HN classics, hidden gems, recent favorites, new topics, and once you like posts, similar ones and ones the same HN people recommend. The line above each post says why it's there. |
| | **Following**: follow channels, see their posts |
| Categories | **Explore**: trending topics and channels, profile page per channel |
| Playlists | **Lists**, curated by Claude |
| Watch later | **Bookmarks** |
| Liked, History, Longs, Search with filters, keyboard shortcuts | Same, with X's Search filters panel and `j`/`k`/`l`/`b` shortcuts |
| Video frames instead of thumbnails | Same, plus X's Default / Dim / Lights out themes and accent colors |

No logins: likes, bookmarks, follows and history live in your browser's localStorage.

## How it works

It's a static site, no server and no database.

- `scripts/build_data.py` turns [HackerTube's data export](https://hackertube.org/data) into `public/data/`: one compact
  `videos.json` for the timeline and search, plus one small file per video with its HN replies, "HN people also recommend",
  and the 20 nearest videos by embedding.
- `public/app.js` is the whole app: router, timeline, recommendations, search, pages. `public/app.css` is the X look.
- `scripts/fetch_meta.mjs` is the Vercel build step. YouTube's own metadata (durations, views, upload dates) can't be
  redistributed, so it isn't in the repo. Set `YOUTUBE_API_KEY` on the Vercel project and each deploy fetches it fresh
  (about 130 requests); Longs, durations, view counts and date filters then light up. Without a key everything else works.

```sh
python3 -m venv .venv && .venv/bin/pip install numpy
.venv/bin/python scripts/build_data.py          # downloads the export into data-src/ on first run
npx serve -s public                             # or: vercel dev
```

## Credits

Data, comment labels, video cards, topics and playlists: [HackerTube](https://hackertube.org) (built by Claude Opus 5.5,
prompted by @karpathy), under [ODC-By 1.0](https://opendatacommons.org/licenses/by/1-0/), derived from the
[open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news) archive. Comments remain the work of their
authors. Not affiliated with X, YouTube, Google, Hacker News or Y Combinator.

Created in [T3 Code](https://t3.codes) with Claude Code.
