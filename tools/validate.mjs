#!/usr/bin/env node
/* LinguaGuess dataset validator (dev-only, never shipped to the page).
   Usage: node tools/validate.mjs [lang…]  , no args = all 12 languages.

   Per language it enforces:
     · ≥ 100 snippets, no exact duplicates
     · 5-15 lines and 40-120 words per snippet
     · no forbidden characters (wrong-alphabet letters leaking in)
     · classifier tier split: ≥ 50 easy and ≥ 35 hard
   Exits non-zero on any violation. */

import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { RULES, classify } = require(path.join(root, 'js', 'classifier.js'));

const ALL = ['ru', 'uk', 'be', 'bg', 'fr', 'es', 'it', 'pt', 'sv', 'da', 'no', 'is'];
const MIN = { count: 100, easy: 50, hard: 35 };
const LINES = [5, 15];
const WORDS = [40, 120];

const langs = process.argv.length > 2 ? process.argv.slice(2) : ALL;
let failed = false;
const fail = msg => { failed = true; console.error(`  ✗ ${msg}`); };

/* Data files are browser scripts; run them in a sandbox where `window` is the
   context itself so bare `LG` resolves exactly like it does in a browser. */
function loadTexts(lang) {
  const file = path.join(root, 'js', 'data', `${lang}.js`);
  if (!existsSync(file)) return null;
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(file, 'utf8'), ctx, { filename: file });
  return ctx.LG?.data?.texts?.[lang] ?? null;
}

const seen = new Map(); // exact text -> lang, across all languages

for (const lang of langs) {
  console.log(`\n── ${lang} ──`);
  const texts = loadTexts(lang);
  if (!texts) { fail(`js/data/${lang}.js missing or defines no LG.data.texts.${lang}`); continue; }

  if (texts.length < MIN.count) fail(`only ${texts.length} snippets (need ≥ ${MIN.count})`);

  let easy = 0, hard = 0;
  let wMin = Infinity, wMax = 0, lMin = Infinity, lMax = 0;

  texts.forEach((text, i) => {
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).filter(Boolean).length;
    lMin = Math.min(lMin, lines); lMax = Math.max(lMax, lines);
    wMin = Math.min(wMin, words); wMax = Math.max(wMax, words);
    if (lines < LINES[0] || lines > LINES[1]) fail(`#${i}: ${lines} lines, "${text.split('\n')[0].slice(0, 40)}…"`);
    if (words < WORDS[0] || words > WORDS[1]) fail(`#${i}: ${words} words, "${text.split('\n')[0].slice(0, 40)}…"`);

    for (const { re, label } of RULES[lang].forbidden) {
      const m = text.toLowerCase().match(re);
      if (m) fail(`#${i}: forbidden ${label} "${m[0]}", "${text.split('\n')[0].slice(0, 40)}…"`);
    }

    if (seen.has(text)) fail(`#${i}: duplicate of a snippet in "${seen.get(text)}"`);
    else seen.set(text, lang);

    classify(text, lang).tier === 'easy' ? easy++ : hard++;
  });

  if (easy < MIN.easy) fail(`only ${easy} easy-tier snippets (need ≥ ${MIN.easy})`);
  if (hard < MIN.hard) fail(`only ${hard} hard-tier snippets (need ≥ ${MIN.hard})`);

  console.log(`  ${texts.length} snippets · easy ${easy} / hard ${hard} · words ${wMin}-${wMax} · lines ${lMin}-${lMax}`);
}

console.log(failed ? '\nFAILED' : '\nOK');
process.exitCode = failed ? 1 : 0;
