# 🌍 LinguaGuess

### ▶ Play it at [linguaguess.pages.dev](https://linguaguess.pages.dev)

A language identification game that runs entirely in the browser. Read a short
passage of five to fifteen lines, work out which language it is, and see how fast
you can do it. No framework, no build step, no external dependency.

## Modes

| Mode | Languages | Script |
|---|---|---|
| **Slavic** | Russian · Ukrainian · Belarusian · Bulgarian | Cyrillic |
| **Romance** | French · Spanish · Italian · Portuguese | Latin |
| **Nordic** | Swedish · Danish · Norwegian · Icelandic | Latin, North Germanic |

Each mode has two difficulties:

- **Easy** serves passages loaded with obvious orthographic markers such as ї, ў,
  ъ, ñ, ã, þ or ä.
- **Hard** mixes those with passages deliberately stripped of the rare letters, so
  you have to fall back on function words and morphology. Telling Danish from
  Norwegian, for instance, comes down to *af* against *av* and *meget* against *mye*.

## Scoring

A match is ten texts. Each correct answer is worth 100 raw points, so a perfect
match is 1000 before the clock is taken into account.

**The clock only runs while you are deciding.** It starts when a text appears,
stops the instant you answer, and starts again on the next text, so reading the
feedback or pausing between rounds costs nothing. The badge dims while it is
stopped. On that thinking time it applies a multiplier that never lets the
maximum exceed 1000:

- the first **15 seconds per text**, which is 2 min 30 for a ten-text match, are
  free and cost nothing at all;
- past that budget the multiplier **halves every five minutes**;
- it bottoms out at 1% of the raw score, which a perfect match reaches around
  38 minutes.

| Match duration | Multiplier | Perfect match scores |
|---|---|---|
| up to 2:30 | ×1.00 | 1000 |
| 5:00 | ×0.71 | 707 |
| 7:30 | ×0.50 | 500 |
| 10:00 | ×0.35 | 354 |
| 20:00 | ×0.09 | 88 |

Around the five-minute mark, ten seconds are worth roughly sixteen points, which
is enough to separate two players who answered equally well. The header shows the
raw score and the running clock, and the multiplier appears next to the clock as
soon as it starts biting, so the final number is never a surprise. The results
screen spells the arithmetic out: `700 points ×0.81 for 4:00`.

## Leaderboard

Each mode and difficulty has its own top 100. At the end of a match, if the score
reaches the board, a button offers to save it under a name of your choice. The
results screen shows the top ten, and the trophy button on each menu card opens
the full page, where the list scrolls to a hundred entries and can be filtered by
name.

Scores are submitted as plain inserts, so two players finishing at the same second
never overwrite each other and the ranking is always recomputed by the database.
If the API cannot be reached, whether it is offline or the daily free quota is
spent, the game says so plainly and carries on: the board simply does not appear.

## Running it locally

```bash
node tools/dev-server.mjs            # http://127.0.0.1:8765, leaderboard included
LG_BOARD_FAIL=1 node tools/dev-server.mjs   # forces the "unavailable" path
```

Scores held by the dev server live in memory and disappear when it stops. Opening
`index.html` straight from disk also works, without the leaderboard.

## Deploying

The site and its API deploy together on **Cloudflare Pages**, on the free plan.

```bash
npx wrangler d1 create linguaguess          # paste the id into wrangler.toml
npx wrangler d1 execute linguaguess --remote --file=schema.sql
npx wrangler pages deploy .                 # or connect the repo for auto-deploy
```

Everything under `functions/` is published alongside the static files, so the API
answers on the same origin at `/api/scores` with no CORS to configure. In the
dashboard, bind the D1 database to the variable `DB` for the Pages project.

The free plan covers 100 000 requests and 100 000 written rows per day. It has no
payment method attached and never upgrades on its own: past the quota Cloudflare
returns an error and the game falls back to its "unavailable" message until the
counter resets at midnight UTC.

**GitHub Pages** also hosts the game perfectly well, since it is only static
files, but the leaderboard needs the Cloudflare Function to answer somewhere.

## Project layout

```
index.html            app shell
css/style.css         all styling
js/i18n.js            interface copy (en/fr), metadata, formatters
js/guides.js          bilingual explanation content per mode
js/classifier.js      heuristic rules grading every snippet easy or hard
js/game.js            sampling, timing, scoring, confusion matrix (DOM-free)
js/leaderboard.js     API client, caching, graceful failure
js/views.js           DOM rendering for every screen
js/app.js             state, routing, clock, persistence
js/data/<lang>.js     100+ snippets per language, twelve files
functions/api/scores.js   leaderboard API (Cloudflare Pages Function)
schema.sql            D1 table and index
tools/dev-server.mjs  local static server plus a stand-in API
tools/validate.mjs    dataset validator
tools/smoke.mjs       game logic and scoring tests
```

## Dataset

About 1 276 snippets, at least a hundred per language, each five to fifteen lines
and forty to a hundred and twenty words. Every passage is an **original text
written for this game**, not an excerpt from a copyrighted corpus, and each pool
is built so that it splits into marker-rich and marker-poor halves.

The easy and hard grading is automatic: `js/classifier.js` scores every snippet
against weighted per-language rules at load time. The same rules run in Node:

```bash
node tools/validate.mjs      # counts, lengths, forbidden characters, tier split
node tools/smoke.mjs         # sampling balance, scoring, time multiplier
```

## Licence

MIT. The passages are original compositions and can be reused freely with
attribution.
