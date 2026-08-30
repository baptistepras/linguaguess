/* LinguaGuess: match logic and scoring.
   Deliberately DOM-free so tools/smoke.mjs can test it in Node. */
window.LG = window.LG || {};

LG.game = (() => {
  const ROUNDS = 10;
  const POINTS = 100;                 // raw points per correct answer

  /* Scoring. Accuracy decides the rank and speed only separates players who got
     the same number right, so each score sits in the band between its own tier
     and the next: 8 correct is worth 800 to 899, 9 correct 900 to 999. Reading a
     score therefore tells you both halves at a glance.

     Speed is worth the whole band, so its ceiling per tier is the gap up to the
     tier above. The perfect run has no tier above and gets a round 1.10.

     The speed factor runs from 1 at the first second to 0 once the bonus is
     spent, passing through exactly one half at the equilibrium. Both times are
     per text so the curve keeps its shape if ROUNDS ever changes:
       equilibrium = 20 s per text → 3:20 for ten texts, half the bonus
       zero        = 60 s per text → 10:00, no bonus left

     The exponent is what makes the curve hit all three points exactly; it is
     derived, never tuned. The shape is an S: nearly flat over the first seconds,
     steepest around the equilibrium where most players finish, flat again as it
     lands on zero. */
  const EQUILIBRIUM_MS_PER_ROUND = 20_000;
  const ZERO_MS_PER_ROUND = 60_000;
  const CURVE_EXPONENT =
    Math.log(0.5) / Math.log(EQUILIBRIUM_MS_PER_ROUND / ZERO_MS_PER_ROUND);
  const PERFECT_MULTIPLIER = 1.1;   // 1000 → 1100, the only round number in the set
  const MAX_SCORE = 1100;

  /* In-place Fisher-Yates. */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function sample(arr, n) {
    return shuffle(arr.slice()).slice(0, n);
  }

  /* Classify every snippet once at startup: pools[mode][lang] = { easy: [i…], hard: [i…] }. */
  let pools = null;
  function buildPools() {
    pools = {};
    for (const [mode, cfg] of Object.entries(LG.MODES)) {
      pools[mode] = {};
      for (const lang of cfg.langs) {
        const texts = LG.data.texts[lang] || [];
        const easy = [], hard = [];
        texts.forEach((t, i) => {
          (LG.classifier.classify(t, lang).tier === 'easy' ? easy : hard).push(i);
        });
        pools[mode][lang] = { easy, hard };
      }
    }
  }

  /* Pick `n` distinct snippet indices for one language at the given difficulty.
     Easy: unambiguous passages only. Hard: the full mixed pool, but with at
     least one genuinely hard passage per language when the pool allows it. */
  function pickForLang(mode, lang, difficulty, n) {
    const p = pools[mode][lang];
    if (difficulty === 'easy') return sample(p.easy, n);
    const picked = sample(p.hard, Math.min(1, p.hard.length));
    const rest = p.easy.concat(p.hard).filter(i => !picked.includes(i));
    return picked.concat(sample(rest, n - picked.length));
  }

  function newMatch(mode, difficulty) {
    if (!pools) buildPools();
    const langs = LG.MODES[mode].langs;
    const counts = shuffle([3, 3, 2, 2]); // 10 rounds spread over 4 languages
    const rounds = [];
    langs.forEach((lang, k) => {
      for (const i of pickForLang(mode, lang, difficulty, counts[k])) {
        const text = LG.data.texts[lang][i];
        rounds.push({ lang, text, tier: LG.classifier.classify(text, lang).tier });
      }
    });
    shuffle(rounds);
    return {
      mode, difficulty, rounds, index: 0,
      raw: 0,                     // points before the time multiplier
      answers: [],
      startedAt: Date.now(),      // wall clock, kept for reference only
      elapsedMs: 0,               // thinking time banked by finished rounds
      roundStartedAt: Date.now(), // when the current text went up, null while paused
    };
  }

  /* Only the time spent deciding counts. The clock stops the moment an answer is
     given and starts again on the next text, so reading the feedback is free. */
  function elapsed(match) {
    return match.elapsedMs + (match.roundStartedAt ? Date.now() - match.roundStartedAt : 0);
  }

  function isPaused(match) {
    return match.roundStartedAt === null;
  }

  function pause(match) {
    if (match.roundStartedAt === null) return;
    match.elapsedMs += Date.now() - match.roundStartedAt;
    match.roundStartedAt = null;
  }

  /* Share of the speed bonus still on the table, from 1 down to 0. */
  function speedFactor(elapsedMs, rounds = ROUNDS) {
    const zero = ZERO_MS_PER_ROUND * rounds;
    if (elapsedMs <= 0) return 1;
    if (elapsedMs >= zero) return 0;
    return (1 + Math.cos(Math.PI * Math.pow(elapsedMs / zero, CURVE_EXPONENT))) / 2;
  }

  /* Ceiling for a given number of correct answers: everything up to one point
     below the next tier, so the bands can never overlap. */
  function maxMultiplier(correct) {
    if (correct <= 0) return 1;
    if (correct >= ROUNDS) return PERFECT_MULTIPLIER;
    return (POINTS * (correct + 1) - 1) / (POINTS * correct);
  }

  function multiplierFor(correct, elapsedMs, rounds = ROUNDS) {
    return 1 + (maxMultiplier(correct) - 1) * speedFactor(elapsedMs, rounds);
  }

  function correctCount(match) {
    return match.raw / POINTS;
  }

  function currentMultiplier(match) {
    return multiplierFor(correctCount(match), elapsed(match), match.rounds.length);
  }

  /* What the raw points are worth once the clock is taken into account.
     Nothing right is worth nothing, however fast it was answered. */
  function finalScore(match) {
    return Math.round(match.raw * currentMultiplier(match));
  }

  /* Record the guess for the current round; the caller advances with next(). */
  function answer(match, guess) {
    pause(match);               // stop the clock at the instant of the answer
    const round = match.rounds[match.index];
    const correct = guess === round.lang;
    if (correct) match.raw += POINTS;
    match.answers.push({ actual: round.lang, guess, text: round.text });
    return { correct, correctLang: round.lang };
  }

  function next(match) {
    match.index++;
    const more = match.index < match.rounds.length;
    if (more) match.roundStartedAt = Date.now(); // the clock restarts with the new text
    return more;
  }

  /* Aggregate a finished match: per-language accuracy + 4×4 confusion matrix.
     matrix[actual][guessed] = count; cells[actual|guessed] = texts, for drill-down. */
  function summary(match) {
    const langs = LG.MODES[match.mode].langs;
    const perLang = {}, matrix = {}, cells = {};
    for (const a of langs) {
      perLang[a] = { correct: 0, total: 0 };
      matrix[a] = {};
      for (const g of langs) matrix[a][g] = 0;
    }
    for (const { actual, guess, text } of match.answers) {
      perLang[actual].total++;
      if (actual === guess) perLang[actual].correct++;
      matrix[actual][guess]++;
      (cells[`${actual}|${guess}`] = cells[`${actual}|${guess}`] || []).push(text);
    }
    return { perLang, matrix, cells };
  }

  return {
    ROUNDS, POINTS, MAX_SCORE, PERFECT_MULTIPLIER,
    buildPools, newMatch, answer, next, summary,
    elapsed, isPaused, correctCount,
    speedFactor, maxMultiplier, multiplierFor, currentMultiplier, finalScore,
    get pools() { return pools; },
  };
})();
