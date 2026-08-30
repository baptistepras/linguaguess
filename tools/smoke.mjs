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
    const fast = LG.game.finalScore(m);
    check(fast >= m.raw && fast <= (m.raw === 1000 ? 1100 : m.raw + 99),
      `${difficulty}: a fast match sits in its own band (${m.raw} → ${fast})`);
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
  check(LG.game.finalScore(idle) === 1100, 'idling between rounds never costs points');

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

/* ---------- speed curve ---------- */
console.log('\n── speed curve ──');
const min = 60_000;
const speed = ms => LG.game.speedFactor(ms, 10);
check(speed(0) === 1, 'the whole bonus is on the table at the first second');
check(Math.abs(speed(3 * min + 20_000) - 0.5) < 1e-9,
  `exactly half of it is left at 3:20 (${speed(3 * min + 20_000)})`);
check(speed(10 * min) === 0 && speed(30 * min) === 0, 'and none of it from 10:00 onwards');
check(speed(60_000) > speed(70_000), 'ten seconds always cost part of the bonus');

let previousSpeed = Infinity;
for (let ms = 0; ms <= 12 * min; ms += 5_000) {
  if (speed(ms) > previousSpeed) { check(false, `the bonus grows back at ${ms} ms`); break; }
  previousSpeed = speed(ms);
}
check(previousSpeed === 0, 'the bonus decreases monotonically to zero');

/* ---------- score bands ---------- */
console.log('\n── score bands ──');
const scoreFor = (c, ms) => Math.round(100 * c * LG.game.multiplierFor(c, ms, 10));
const bandTop = c => (c === 10 ? LG.game.MAX_SCORE : 100 * c + 99);

for (let c = 1; c <= 10; c++) {
  check(scoreFor(c, 0) === bandTop(c),
    `${c}/10 answered instantly tops its band at ${scoreFor(c, 0)}`);
  check(scoreFor(c, 10 * min) === 100 * c,
    `${c}/10 answered slowly falls back to ${100 * c}`);
}
check(scoreFor(0, 0) === 0, 'nothing right is worth nothing, however fast');
check(scoreFor(10, 0) === 1100, 'the maximum is a round 1100');

// The point of the whole design: speed never crosses a tier.
for (let c = 1; c < 10; c++) {
  check(bandTop(c) < 100 * (c + 1),
    `${c}/10 at full speed stays below ${c + 1}/10 at its slowest`);
}
check(scoreFor(6, 0) < scoreFor(8, 10 * min), 'a rushed 6/10 never beats a plodding 8/10');
check(scoreFor(9, 0) < scoreFor(10, 10 * min), 'nor a rushed 9/10 a plodding sans-faute');

// Landmarks a player can feel.
check(scoreFor(10, 200_000) === 1050, `3:20 on a perfect run scores ${scoreFor(10, 200_000)}`);
check(scoreFor(8, 200_000) === 850, `3:20 on 8/10 scores ${scoreFor(8, 200_000)}`);
let previousScore = Infinity;
for (let ms = 0; ms <= 12 * min; ms += 5_000) {
  const v = scoreFor(9, ms);
  if (v > previousScore) { check(false, `a 9/10 gains points by waiting at ${ms} ms`); break; }
  previousScore = v;
}
check(previousScore === 900, 'a 9/10 decreases monotonically down to its floor of 900');

console.log(failed ? '\nFAILED' : '\nOK');
process.exitCode = failed ? 1 : 0;
