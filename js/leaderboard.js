/* LinguaGuess: leaderboard client.
   Talks to /api/scores. Every call resolves to { ok, entries } or { ok: false },
   never throws, so a missing or rate-limited backend only hides the board and
   never interferes with the game itself. */
window.LG = window.LG || {};

LG.leaderboard = (() => {
  const ENDPOINT = 'api/scores';   // relative, so it works from any sub-path
  const TIMEOUT_MS = 6_000;
  const CACHE_MS = 60_000;         // one fetch per board per minute at most
  const TOP_ON_RESULTS = 10;
  const BOARD_SIZE = 100;
  /* Past ten minutes the multiplier is stuck at 1, so a longer match still has a
     perfectly valid score and time only breaks ties. A tab left open for days
     would nonetheless exceed what the API accepts, so cap the reported duration
     instead of letting an honest run be rejected. Must match MAX_MS server-side. */
  const MAX_MS = 24 * 60 * 60 * 1000;
  const clampMs = ms => Math.min(Math.max(0, Math.round(ms)), MAX_MS);

  const cache = new Map();         // "mode:difficulty" → { at, payload }
  const key = (mode, difficulty) => `${mode}:${difficulty}`;

  async function request(path, options = {}) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(path, { ...options, signal: abort.signal });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) return { ok: false };
      return body;
    } catch {
      return { ok: false };        // offline, blocked, timed out, no backend
    } finally {
      clearTimeout(timer);
    }
  }

  /* Top 100 for one board. Served from cache unless `force` is set. */
  async function fetchBoard(mode, difficulty, { force = false } = {}) {
    const k = key(mode, difficulty);
    const hit = cache.get(k);
    if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.payload;

    const payload = await request(`${ENDPOINT}?mode=${mode}&difficulty=${difficulty}`);
    if (payload.ok) cache.set(k, { at: Date.now(), payload });
    return payload;
  }

  /* Where a score would land, 1-based, or null if it misses the board.
     Same ordering as the server: score, then time to the second, then seniority.
     The `<=` is what gives seniority away: on an equal second the entry already
     on the board keeps its place and the newcomer lands just below. */
  function rankFor(entries, score, ms) {
    const sec = t => Math.floor(clampMs(t) / 1000);
    const better = entries.filter(e =>
      e.score > score || (e.score === score && sec(e.ms) <= sec(ms))).length;
    const rank = better + 1;
    return rank <= BOARD_SIZE ? rank : null;
  }

  async function submit({ mode, difficulty, name, score, ms }) {
    const payload = await request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode, difficulty, name, score, ms: clampMs(ms) }),
    });
    // The response carries the refreshed board, so replace the cache with it.
    if (payload.ok) cache.set(key(mode, difficulty), { at: Date.now(), payload });
    return payload;
  }

  return { fetchBoard, submit, rankFor, TOP_ON_RESULTS, BOARD_SIZE };
})();
