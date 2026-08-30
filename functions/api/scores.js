/* Leaderboard API, deployed automatically as a Cloudflare Pages Function.
   GET  /api/scores?mode=slavic&difficulty=easy  → top 100 for that board
   POST /api/scores  { mode, difficulty, name, score, ms }  → insert, then top 100

   Storage is D1 (SQLite). Submitting is a plain INSERT, so two players
   finishing at the same moment never overwrite each other, and the ranking is
   recomputed by the database rather than patched in place.

   Every failure, including the daily free-tier quota being spent, comes back as
   503 { ok: false } so the game can say "temporarily unavailable" and carry on. */

const MODES = ['slavic', 'romance', 'nordic'];
const DIFFICULTIES = ['easy', 'hard'];
const BOARD_SIZE = 100;      // rows returned to the client
const KEEP_PER_BOARD = 500;  // rows retained per board, older overflow is pruned
const MAX_SCORE = 1100;      // a perfect run answered instantly
const MIN_SCORE = 100;       // one correct answer; a blank match cannot be saved
const MAX_NAME = 16;
const MIN_MS = 3_000;        // a 10-text match cannot honestly be faster
const MAX_MS = 6 * 60 * 60 * 1000;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    // Harmless when the page and the API share an origin; useful if they ever do not.
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  },
});

const unavailable = () => json({ ok: false, error: 'unavailable' }, 503);

/* Names are shown as text, never as HTML, but keep the stored value tidy anyway:
   no control characters, no runs of whitespace, no unicode direction tricks. */
function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
  return name.length ? name : null;
}

function board(mode, difficulty) {
  return MODES.includes(mode) && DIFFICULTIES.includes(difficulty);
}

async function topEntries(db, mode, difficulty) {
  const { results } = await db
    .prepare(`SELECT name, score, ms FROM scores
                WHERE mode = ?1 AND difficulty = ?2
                ORDER BY score DESC, ms / 1000 ASC, id ASC
                LIMIT ${BOARD_SIZE}`)
    .bind(mode, difficulty)
    .all();
  return results.map((row, i) => ({ rank: i + 1, ...row }));
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');
  const difficulty = url.searchParams.get('difficulty');
  if (!board(mode, difficulty)) return json({ ok: false, error: 'invalid' }, 400);
  if (!env.DB) return unavailable();

  try {
    return json({ ok: true, entries: await topEntries(env.DB, mode, difficulty) });
  } catch {
    return unavailable(); // quota spent, database asleep, anything else
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid' }, 400); }

  const { mode, difficulty } = body || {};
  const name = cleanName(body?.name);
  const score = Number(body?.score);
  const ms = Number(body?.ms);

  const valid = board(mode, difficulty) && name
    && Number.isInteger(score) && score >= MIN_SCORE && score <= MAX_SCORE
    && Number.isFinite(ms) && ms >= MIN_MS && ms <= MAX_MS;
  if (!valid) return json({ ok: false, error: 'invalid' }, 400);
  if (!env.DB) return unavailable();

  try {
    await env.DB
      .prepare(`INSERT INTO scores (mode, difficulty, name, score, ms, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
      .bind(mode, difficulty, name, score, Math.round(ms), Date.now())
      .run();

    // Keep each board bounded; the tail is never displayed anyway.
    await env.DB
      .prepare(`DELETE FROM scores
                 WHERE mode = ?1 AND difficulty = ?2
                   AND id NOT IN (SELECT id FROM scores
                                   WHERE mode = ?1 AND difficulty = ?2
                                   ORDER BY score DESC, ms / 1000 ASC, id ASC
                                   LIMIT ${KEEP_PER_BOARD})`)
      .bind(mode, difficulty)
      .run();

    const entries = await topEntries(env.DB, mode, difficulty);
    // The rank the database actually settled on, which may differ from the
    // client's estimate if somebody else submitted a moment earlier.
    const mine = entries.find(e => e.name === name && e.score === score && e.ms === Math.round(ms));
    return json({ ok: true, rank: mine ? mine.rank : null, entries });
  } catch {
    return unavailable();
  }
}
