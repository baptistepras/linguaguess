/* LinguaGuess: application state, persistence and view routing. */
window.LG = window.LG || {};

LG.state = {
  view: 'menu',            // 'menu' | 'guide' | 'game' | 'results' | 'board'
  mode: null,
  match: null,
  lastNewBest: false,
  uiLang: 'en',
  menuDiff: { slavic: 'easy', romance: 'easy', nordic: 'easy' },
  best: { slavic: {}, romance: {}, nordic: {} },
  lastName: '',            // pre-fills the leaderboard name box
  boardMode: 'slavic',     // full leaderboard page
  boardDiff: 'easy',
  boardQuery: '',
  boardEntries: null,
};

LG.app = (() => {
  const STORE_KEY = 'linguaguess.v1';
  const $ = id => document.getElementById(id);
  let clock = null;        // interval that drives the in-game timer

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw) {
        if (raw.uiLang === 'en' || raw.uiLang === 'fr') LG.state.uiLang = raw.uiLang;
        if (raw.best) Object.assign(LG.state.best, raw.best);
        if (typeof raw.lastName === 'string') LG.state.lastName = raw.lastName.slice(0, 16);
      }
    } catch { /* corrupted storage, fall back to defaults */ }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        uiLang: LG.state.uiLang,
        best: LG.state.best,
        lastName: LG.state.lastName,
      }));
    } catch { /* private mode and the like, the game still works without it */ }
  }

  /* ---------- Header ---------- */

  function modeTitle(mode) {
    return LG.t('modeName')[mode || LG.state.mode];
  }

  function viewTitle() {
    const s = LG.state;
    switch (s.view) {
      case 'guide':   return LG.t('guideTitle', modeTitle());
      case 'game':    return LG.t('gameTitle', modeTitle(), LG.t(s.match.difficulty));
      case 'results': return LG.t('resultsTitle', modeTitle());
      case 'board':   return LG.t('boardTitle', modeTitle(s.boardMode));
      default:        return LG.t('mainMenu');
    }
  }

  function updateHeader() {
    const s = LG.state;
    $('view-title').textContent = viewTitle();

    // Home leads back to the menu, so it is pointless on the menu itself and
    // deliberately absent from the final score screen.
    $('home-btn').hidden = s.view === 'menu' || s.view === 'results';

    const inGame = s.view === 'game';
    $('score-badge').hidden = !inGame;
    $('time-badge').hidden = !inGame;
    if (inGame) updateHeaderBadges();

    document.querySelectorAll('.flag-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.uilang === s.uiLang));
    document.documentElement.lang = s.uiLang;
  }

  /* Live score and clock. The score shown is the raw one, which only ever goes
     up. The multiplier itself would be misleading here, since its ceiling drops
     as answers land, so the badge carries the speed gauge instead: it depends on
     the clock alone and says plainly how much bonus is left to win. */
  function updateHeaderBadges() {
    const m = LG.state.match;
    if (!m) return;
    $('score-badge').textContent = LG.t('scoreLabel', m.raw);
    const speed = LG.game.speedFactor(LG.game.elapsed(m), m.rounds.length);
    const time = LG.fmt.time(LG.game.elapsed(m));
    $('time-text').textContent =
      `${LG.t('elapsedLabel', time)} · ${LG.t('speedLabel', Math.round(speed * 100))}`;
    // Dim the badge while the clock is stopped, so a frozen number reads as
    // deliberate rather than broken.
    $('time-badge').classList.toggle('paused', LG.game.isPaused(m));
  }

  function startClock() {
    stopClock();
    clock = setInterval(() => {
      if (LG.state.view !== 'game' || !LG.state.match) return stopClock();
      updateHeaderBadges();
    }, 1000);
  }

  function stopClock() {
    if (clock) { clearInterval(clock); clock = null; }
  }

  /* ---------- Rendering ---------- */

  function render() {
    updateHeader();
    const app = $('app');
    app.innerHTML = '';
    const s = LG.state;
    if (s.view === 'menu') LG.views.renderMenu(app);
    else if (s.view === 'guide') LG.views.renderGuide(app, s.mode);
    else if (s.view === 'game') LG.views.renderGame(app);
    else if (s.view === 'results') LG.views.renderResults(app, s.lastNewBest);
    else if (s.view === 'board') LG.views.renderBoard(app);

    s.view === 'game' ? startClock() : stopClock();
    window.scrollTo(0, 0);
  }

  /* ---------- Navigation ---------- */

  function goMenu() {
    LG.state.view = 'menu';
    LG.state.match = null;
    render();
  }

  function goGuide(mode) {
    LG.state.view = 'guide';
    LG.state.mode = mode;
    render();
  }

  /* Opens the full leaderboard on the difficulty currently selected on that card. */
  function goBoard(mode) {
    LG.state.view = 'board';
    LG.state.mode = mode;
    LG.state.boardMode = mode;
    LG.state.boardDiff = LG.state.menuDiff[mode];
    LG.state.boardQuery = '';
    LG.state.boardEntries = null;
    render();
  }

  function startMatch(mode, difficulty) {
    LG.state.mode = mode;
    LG.state.match = LG.game.newMatch(mode, difficulty);
    LG.state.view = 'game';
    render();
  }

  function nextRound() {
    const m = LG.state.match;
    if (LG.game.next(m)) {
      render();
      return;
    }
    // Match over: freeze the time-adjusted score, then settle the personal best.
    m.final = LG.game.finalScore(m);
    const best = LG.state.best[m.mode];
    LG.state.lastNewBest = best[m.difficulty] == null || m.final > best[m.difficulty];
    if (LG.state.lastNewBest) {
      best[m.difficulty] = m.final;
      save();
    }
    LG.state.view = 'results';
    render();
  }

  function setUiLang(lang) {
    LG.state.uiLang = lang;
    save();
    render(); // views re-read every string; an answered round repaints as answered
  }

  /* ---------- Boot ---------- */

  function init() {
    load();
    LG.game.buildPools();
    $('home-btn').addEventListener('click', () => {
      if (LG.state.view === 'game') LG.views.showQuitModal();
      else goMenu();
    });
    document.querySelectorAll('.flag-btn').forEach(b =>
      b.addEventListener('click', () => setUiLang(b.dataset.uilang)));
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { render, goMenu, goGuide, goBoard, startMatch, nextRound, updateHeaderBadges, save };
})();
