/* LinguaGuess: match logic and scoring.
   Deliberately DOM-free so tools/smoke.mjs can test it in Node. */
window.LG = window.LG || {};

LG.game = (() => {
  const ROUNDS = 10;
  const POINTS = 100;                 // raw points per correct answer

  /* Time bonus. The clock runs from the first text to the last answer.
     A grace budget covers honest reading, then the multiplier halves every
     half-life, down to a 1% floor. Tuned per round so the curve keeps its
     shape if ROUNDS ever changes:
       grace  = 15 s per text  → 2 min 30 for a 10-text match
       half   = 30 s per text  → 5 min
     Landmarks for 10 texts: 2:30 keeps 100%, 5:00 keeps 71%, 10:00 keeps 35%,
     20:00 keeps 9%, and the floor is reached around 38 minutes. */
  const GRACE_MS_PER_ROUND = 15_000;
  const HALF_LIFE_MS_PER_ROUND = 30_000;
  const MIN_MULTIPLIER = 0.01;

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

  /* 1.0 during the grace budget, then halves every half-life, floored at 1%. */
  function timeMultiplier(elapsedMs, rounds = ROUNDS) {
    const grace = GRACE_MS_PER_ROUND * rounds;
    if (elapsedMs <= grace) return 1;
    const decay = Math.pow(2, -(elapsedMs - grace) / (HALF_LIFE_MS_PER_ROUND * rounds));
    return Math.max(MIN_MULTIPLIER, decay);
  }

  function currentMultiplier(match) {
    return timeMultiplier(elapsed(match), match.rounds.length);
  }

  /* What the raw points are worth once the clock is taken into account. */
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
    ROUNDS, POINTS, MIN_MULTIPLIER,
    buildPools, newMatch, answer, next, summary,
    elapsed, isPaused, timeMultiplier, currentMultiplier, finalScore,
    get pools() { return pools; },
  };
})();
