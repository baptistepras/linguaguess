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

A match is ten texts, and each correct answer is worth 100 base points. **Accuracy
decides the rank; speed only separates players who got the same number right.**

Every tier owns the band between itself and the next one, so eight correct is
worth 800 to 899 and nine correct 900 to 999, whatever the clock says. A rushed
6/10 can therefore never overtake a plodding 8/10. The consequence is a score you
can read: **873** means eight correct and 73% of the speed bonus still unspent.

Speed fills that band through a multiplier, whose ceiling is exactly the gap up to
the tier above (`899 / 800` for eight correct). The perfect run has no tier above
it and gets a round ×1.10, for a maximum of **1100**. Nothing correct is worth
nothing, however fast.

**The clock only runs while you are deciding.** It starts when a text appears,
stops the instant you answer, and starts again on the next text, so reading the
feedback or pausing between rounds costs nothing.

| Match duration | Speed left | 10/10 | 9/10 | 8/10 | 5/10 |
|---|---|---|---|---|---|
| instant | 100% | 1100 | 999 | 899 | 599 |
| 1:00 | 87% | 1087 | 986 | 886 | 586 |
| 2:30 | 63% | 1063 | 962 | 862 | 562 |
| **3:20** | **50%** | **1050** | **950** | **850** | **550** |
| 5:00 | 28% | 1028 | 928 | 828 | 528 |
| 10:00 and beyond | 0% | 1000 | 900 | 800 | 500 |

The bonus follows an S-curve that is whole at the first second, exactly half spent
at **20 seconds per text**, and gone at **60 seconds per text**. It is nearly flat
over the opening seconds, since reading takes time no matter who you are, steepest
around the equilibrium where most players finish, and flat again as it lands on
zero. All three modes share the same curve: the game is meant to be played
internationally, and a Norwegian should not get more time on the Nordic board than
on the Romance one.

The header shows the base score, which only ever goes up, and the clock with the
share of bonus still on the table. The results screen then spells the arithmetic
out in full: correct answers, base score, time spent, multiplier, final score.

## Leaderboard

Each mode and difficulty has its own top 100. At the end of a match, if the score
reaches the board, a button offers to save it under a name of your choice. A
blank match cannot be saved even when the board has room to spare. The results
screen shows the top ten, and the trophy button on each menu card opens the full
page, where the list scrolls to a hundred entries and can be filtered by name.

Entries are ranked by score, then by time to the second, then by seniority: on a
perfect tie the player already on the board keeps the place and the newcomer
lands just below, so two rows are never truly equal.

Past ten minutes the multiplier is pinned at ×1.00, so a match left running for
hours keeps a perfectly valid score and its duration only breaks ties. Durations
are shown as `h:mm:ss` once they pass the hour, and the game caps the figure it
reports at a day, so a tab left open overnight is saved rather than refused.

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
