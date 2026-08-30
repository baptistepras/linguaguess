#!/usr/bin/env node
/* Local development server: serves the static site and answers /api/scores with
   the same contract as the Cloudflare Function, so the leaderboard can be tried
   out without deploying anything.

   Usage:
     node tools/dev-server.mjs            → http://127.0.0.1:8765
     LG_PORT=3000 node tools/dev-server.mjs
     LG_BOARD_FAIL=1 node tools/dev-server.mjs   → API always answers 503,
                                                   to check the "unavailable" path

   Scores live in memory only and disappear when the process stops. */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.LG_PORT || 8765);
const ALWAYS_FAIL = process.env.LG_BOARD_FAIL === '1';

const MODES = ['slavic', 'romance', 'nordic'];
const DIFFICULTIES = ['easy', 'hard'];
const BOARD_SIZE = 100;
const MAX_NAME = 16;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.sql': 'text/plain; charset=utf-8',
};

const scores = [];   // { mode, difficulty, name, score, ms, id }
let nextId = 1;

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  if (status >= 400) console.log(`  ${status} ${res.req?.method} ${res.req?.url}`, body);
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const cleanName = raw => typeof raw === 'string'
  ? raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e]/g, '')
       .replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || null
  : null;

const topEntries = (mode, difficulty) => scores
  .filter(s => s.mode === mode && s.difficulty === difficulty)
  .sort((a, b) => b.score - a.score || a.ms - b.ms || a.id - b.id)
  .slice(0, BOARD_SIZE)
  .map((s, i) => ({ rank: i + 1, name: s.name, score: s.score, ms: s.ms }));

const validBoard = (mode, difficulty) =>
  MODES.includes(mode) && DIFFICULTIES.includes(difficulty);

async function handleApi(req, res, url) {
  if (ALWAYS_FAIL) return send(res, 503, { ok: false, error: 'unavailable' });

  if (req.method === 'GET') {
    const mode = url.searchParams.get('mode');
    const difficulty = url.searchParams.get('difficulty');
    if (!validBoard(mode, difficulty)) return send(res, 400, { ok: false, error: 'invalid' });
    return send(res, 200, { ok: true, entries: topEntries(mode, difficulty) });
  }

  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return send(res, 400, { ok: false, error: 'invalid' }); }

    const { mode, difficulty } = body || {};
    const name = cleanName(body?.name);
    const score = Number(body?.score);
    const ms = Math.round(Number(body?.ms));
    const ok = validBoard(mode, difficulty) && name
      && Number.isInteger(score) && score >= 0 && score <= 1000
      && Number.isFinite(ms) && ms >= 3000;
    if (!ok) return send(res, 400, { ok: false, error: 'invalid' });

    scores.push({ id: nextId++, mode, difficulty, name, score, ms });
    const entries = topEntries(mode, difficulty);
    const mine = entries.find(e => e.name === name && e.score === score && e.ms === ms);
    return send(res, 200, { ok: true, rank: mine ? mine.rank : null, entries });
  }

  return send(res, 405, { ok: false, error: 'method' });
}

/* Development convenience: wipe the in-memory board so a test run starts clean.
   The deployed Cloudflare Function has no such route. */
function handleReset(res) {
  scores.length = 0;
  nextId = 1;
  send(res, 200, { ok: true });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/scores') return handleApi(req, res, url);
  if (url.pathname === '/api/reset') return handleReset(res);

  const rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) return send(res, 403, 'forbidden', 'text/plain');

  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    send(res, 404, 'not found', 'text/plain');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`LinguaGuess dev server on http://127.0.0.1:${PORT}`);
  if (ALWAYS_FAIL) console.log('leaderboard API forced to answer 503');
});
