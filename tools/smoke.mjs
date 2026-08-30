#!/usr/bin/env node
/* Dev-only smoke test: loads the browser scripts in a sandbox and exercises
   the DOM-free game logic, pools, match sampling, scoring, summary. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);

const files = ['js/i18n.js', 'js/guides.js', 'js/classifier.js',
  ...['ru','uk','be','bg','fr','es','it','pt','sv','da','no','is'].map(l => `js/data/${l}.js`),
  'js/game.js'];
for (const f of files) vm.runInContext(readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });

const { LG } = ctx;
let failed = false;
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) failed = true; };

LG.game.buildPools();

for (const [mode, cfg] of Object.entries(LG.MODES)) {
  console.log(`\n── ${mode} ──`);
  for (const lang of cfg.langs) {
    const p = LG.game.pools[mode][lang];
    check(p.easy.length >= 50, `${lang}: ${p.easy.length} easy-tier snippets (≥50)`);
    check(p.hard.length >= 35, `${lang}: ${p.hard.length} hard-tier snippets (≥35)`);
  }

  for (const difficulty of ['easy', 'hard']) {
    const m = LG.game.newMatch(mode, difficulty);
    const langsUsed = {};
    m.rounds.forEach(r => { langsUsed[r.lang] = (langsUsed[r.lang] || 0) + 1; });
    const counts = Object.values(langsUsed).sort().join(',');
    check(m.rounds.length === 10, `${difficulty}: 10 rounds`);
    check(new Set(m.rounds.map(r => r.text)).size === 10, `${difficulty}: no repeated snippet`);
    check(counts === '2,2,3,3', `${difficulty}: balanced language spread (${counts})`);
    if (difficulty === 'easy') {
      check(m.rounds.every(r => r.tier === 'easy'), 'easy: only easy-tier passages served');
    } else {
      check(m.rounds.some(r => r.tier === 'hard'), 'hard: mixed pool includes hard-tier passages');
    }

    // Play the match: always guess the first language of the mode
    m.rounds.forEach(() => { LG.game.answer(m, cfg.langs[0]); LG.game.next(m); });
    const expected = m.answers.filter(a => a.actual === a.guess).length * LG.game.POINTS;
    check(m.raw === expected, `${difficulty}: raw score arithmetic (${m.raw})`);
    check(LG.game.isPaused(m), `${difficulty}: the clock is stopped once the last answer is in`);
    check(LG.game.finalScore(m) === m.raw, `${difficulty}: a fast match keeps every point`);
    const s = LG.game.summary(m);
    const total = cfg.langs.reduce((n, l) => n + s.perLang[l].total, 0);
    const cells = cfg.langs.reduce((n, a) => n + cfg.langs.reduce((k, g) => k + s.matrix[a][g], 0), 0);
    check(total === 10 && cells === 10, `${difficulty}: summary totals add up to 10`);
  }
}

/* ---------- the clock only runs while deciding ---------- */
console.log('\n── clock ──');
{
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const m = LG.game.newMatch('romance', 'easy');
  check(!LG.game.isPaused(m), 'the clock runs as soon as the first text is up');

  await sleep(120);
  const thinking = LG.game.elapsed(m);
  check(thinking >= 100, `time accrues while deciding (${thinking} ms)`);

  LG.game.answer(m, m.rounds[0].lang);
  check(LG.game.isPaused(m), 'answering stops the clock');
  const atAnswer = LG.game.elapsed(m);
  await sleep(200);
  check(LG.game.elapsed(m) === atAnswer,
    `reading the feedback costs nothing (${LG.game.elapsed(m)} ms, unchanged)`);

  LG.game.next(m);
  check(!LG.game.isPaused(m), 'moving to the next text starts the clock again');
  await sleep(120);
  const resumed = LG.game.elapsed(m);
  check(resumed > atAnswer, `the clock resumes from where it stopped (${atAnswer} then ${resumed} ms)`);

  // A whole match spent idling between rounds must still score as a fast one.
  const idle = LG.game.newMatch('nordic', 'easy');
  for (let i = 0; i < 10; i++) {
    LG.game.answer(idle, idle.rounds[idle.index].lang);
    await sleep(30);            // player stares at the result before clicking Next
    LG.game.next(idle);
  }
  check(LG.game.elapsed(idle) < 250,
    `pauses stay out of the total (${LG.game.elapsed(idle)} ms for ten idle rounds)`);
  check(LG.game.finalScore(idle) === 1000, 'idling between rounds never costs points');

  // Answering must be the only thing that stops the clock, otherwise a player
  // could park on a text and look the answer up for free.
  const open = LG.game.newMatch('slavic', 'hard');
  LG.game.summary(open);
  LG.game.elapsed(open);
  LG.game.currentMultiplier(open);
  LG.game.finalScore(open);
  check(!LG.game.isPaused(open), 'reading the state never stops the clock');
  await sleep(80);
  check(LG.game.elapsed(open) >= 70, 'an unanswered text keeps costing time');
  LG.game.answer(open, open.rounds[0].lang);
  check(LG.game.isPaused(open), 'and only the answer stops it');
}

/* ---------- time multiplier ---------- */
console.log('\n── time multiplier ──');
const min = 60_000;
const mult = ms => LG.game.timeMultiplier(ms, 10);
check(mult(0) === 1 && mult(2.5 * min) === 1, 'the first 2 min 30 cost nothing');
check(Math.abs(mult(5 * min) - 0.7071) < 0.001, `5 min keeps 71% (${mult(5 * min).toFixed(3)})`);
check(Math.abs(mult(7.5 * min) - 0.5) < 0.001, `7 min 30 keeps half (${mult(7.5 * min).toFixed(3)})`);
check(Math.abs(mult(20 * min) - 0.0884) < 0.001, `20 min keeps 9% (${mult(20 * min).toFixed(3)})`);
check(mult(60 * min) === LG.game.MIN_MULTIPLIER, 'an abandoned match bottoms out at 1%');
check(mult(4 * min) > mult(4 * min + 10_000), 'ten seconds always change the multiplier');
const gap = Math.round(1000 * (mult(5 * min) - mult(5 * min + 10_000)));
check(gap >= 10, `ten seconds are worth ${gap} points on a perfect match`);
let previous = 2;
for (let ms = 0; ms <= 45 * min; ms += 15_000) {
  if (mult(ms) > previous) { check(false, 'multiplier never increases'); break; }
  previous = mult(ms);
}
check(previous === LG.game.MIN_MULTIPLIER, 'multiplier decreases monotonically to the floor');

console.log(failed ? '\nFAILED' : '\nOK');
process.exitCode = failed ? 1 : 0;
