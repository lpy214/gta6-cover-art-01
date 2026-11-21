[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lpy214/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lpy214/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Coast Cover Studio

Turn your photo and a caption into GTA-style multi-panel cover art, in your
browser, offline. No upload, no account, no watermark.

## What it does

- **Any photo** — upload your own, or start from the two included sample
  photos. Click a panel to select it, drag inside it to move the photo,
  zoom it with the slider. One photo can fill several panels, each cropped
  differently.
- **Six poster layouts** — Four Panels, Hero + Three, Full Bleed, Tilted
  Snaps (on a drawn sunset skyline), Nine Grid, and Diagonal Split.
- **Five colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Haze
  and Mono Noir, washed over every panel like a sunset print.
- **Bold lettering** — a condensed display title with a sunset gradient
  fill, a neon script subtitle, a five-star heat meter and a corner badge
  ribbon. All of it editable.
- **Fast export** — one click exports a PNG in the post size you picked:
  1080 × 1080, 1080 × 1350 or 1920 × 1080. Shuffle look rolls a random
  layout + grade when you want a surprise.

## Run it

Serve `app/` with any static server and open `index.html` in desktop
Chrome. It makes no network request: every script, font and sample photo
is a file under `app/`, and your photos never leave your machine.

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

## How it is built

- `app/index.html` + `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer: layouts, grades, lettering,
  grain and vignette, all drawn on a 2D canvas.
- `app/src/main.js` — the editor wiring, panel editing, export and the
  `?shot=` screenshot scenes.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
  (`app/fonts/OFL.txt`).
- `app/samples/` — two sample photos made with an image model for
  make.fun, free to use.
- `main.ts` — the make.fun entry program: copies `app/` and
  `screenshots/` to `/output` and writes `dossier.json`.

Everything is original: no Rockstar Games logo, official artwork or font.

## License

MIT — see [LICENSE](LICENSE).
