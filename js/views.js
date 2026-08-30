/* LinguaGuess: view rendering. Builds the DOM for each screen and wires events
   back into LG.app; holds no game state of its own. */
window.LG = window.LG || {};

LG.views = (() => {

  const CHECK_SVG = '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5"/></svg>';
  const CROSS_SVG = '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const TROPHY_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18 3h3v3a4 4 0 0 1-3.6 4A6 6 0 0 1 13 14.9V18h3a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2h3v-3.1A6 6 0 0 1 6.6 10 4 4 0 0 1 3 6V3h3V2h12zM6 5H5v1a2 2 0 0 0 1 1.7zm13 0h-1v2.7A2 2 0 0 0 19 6z"/></svg>';

  const t = (...a) => LG.t(...a);
  const langName = code => LG.LANGS[code].name[LG.state.uiLang];
  const langFlag = code => LG.LANGS[code].flag;

  function div(className, html) {
    const d = document.createElement('div');
    if (className) d.className = className;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function button(className, text, onClick) {
    const b = document.createElement('button');
    b.className = className;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---------- Main menu ---------- */

  function renderMenu(app) {
    const view = div('view');
    const tag = document.createElement('p');
    tag.className = 'tagline';
    tag.textContent = t('tagline');
    view.appendChild(tag);

    const grid = div('mode-grid');
    for (const mode of Object.keys(LG.MODES)) grid.appendChild(modeCard(mode));
    view.appendChild(grid);
    app.appendChild(view);
  }

  function modeCard(mode) {
    const card = div('mode-card glass-card');
    const flags = LG.MODES[mode].langs.map(l =>
      `<div class="flag-tile"><span class="fl">${langFlag(l)}</span><span class="nm">${langName(l)}</span></div>`
    ).join('');

    card.innerHTML = `
      <button class="trophy-btn" data-act="board" aria-label="${t('leaderboard')}" title="${t('leaderboard')}">${TROPHY_SVG}</button>
      <h2>${t('modeName')[mode]}</h2>
      <p class="mode-sub">${t('modeSub')[mode]}</p>
      <div class="flag-grid">${flags}</div>
      <p class="best-line">${bestLine(mode)}</p>
      <div class="card-actions">
        ${segHTML(mode)}
        <div class="row">
          <button class="btn btn-ghost" data-act="guide">${t('guide')}</button>
          <button class="btn btn-primary" data-act="play">${t('play')}</button>
        </div>
      </div>`;

    wireSeg(card, mode);
    card.querySelector('[data-act="board"]').addEventListener('click', () => LG.app.goBoard(mode));
    card.querySelector('[data-act="guide"]').addEventListener('click', () => LG.app.goGuide(mode));
    card.querySelector('[data-act="play"]').addEventListener('click', () => LG.app.startMatch(mode, LG.state.menuDiff[mode]));
    return card;
  }

  function bestLine(mode) {
    const b = LG.state.best[mode] || {};
    const parts = [];
    if (b.easy != null) parts.push(`${t('easy')} ${b.easy}`);
    if (b.hard != null) parts.push(`${t('hard')} ${b.hard}`);
    return parts.length ? t('bestLabel', parts.join(' · ')) : '';
  }

  /* Easy/Hard segmented toggle, shared by menu cards and the guide screen. */
  function segHTML(mode) {
    const d = LG.state.menuDiff[mode];
    return `
      <div class="seg" role="group" aria-label="Difficulty">
        <button data-diff="easy" class="${d === 'easy' ? 'active' : ''}">${t('easy')}</button>
        <button data-diff="hard" class="${d === 'hard' ? 'active' : ''}">${t('hard')}</button>
      </div>`;
  }

  function wireSeg(root, mode) {
    root.querySelectorAll('.seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        LG.state.menuDiff[mode] = btn.dataset.diff;
        root.querySelectorAll('.seg button').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  }

  /* ---------- Explanations / guide ---------- */

  function renderGuide(app, mode) {
    const g = LG.guides[mode];
    const ui = LG.state.uiLang;
    const view = div('view');

    const intro = document.createElement('p');
    intro.className = 'guide-intro';
    intro.textContent = g.intro[ui];
    view.appendChild(intro);

    const grid = div('guide-grid');
    for (const lang of LG.MODES[mode].langs) {
      const lg = g.langs[lang];
      const card = div('lang-guide glass-card');
      card.innerHTML = `
        <h3><span class="fl">${langFlag(lang)}</span> ${langName(lang)}</h3>
        <span class="label">${ui === 'fr' ? 'Lettres signature' : 'Signature letters'}</span>
        <div class="chips">${lg.chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
        <span class="label">${ui === 'fr' ? 'Mots fréquents' : 'Common words'}</span>
        <div class="word-tags">${lg.words.map(w => `<span class="word-tag">${w}</span>`).join('')}</div>
        <span class="label">${ui === 'fr' ? 'Astuces' : 'Tricks'}</span>
        <ul>${lg.notes[ui].map(n => `<li>${n}</li>`).join('')}</ul>`;
      grid.appendChild(card);
    }
    view.appendChild(grid);

    const cmp = div('compare-block glass-card');
    cmp.innerHTML = `
      <h3>${ui === 'fr' ? 'Comment les distinguer' : 'How to tell them apart'}</h3>
      <ul>${g.compare[ui].map(n => `<li>${n}</li>`).join('')}</ul>`;
    view.appendChild(cmp);

    const actions = div('guide-actions');
    actions.innerHTML = `<button class="btn btn-ghost" data-act="back">${t('back')}</button>
      ${segHTML(mode)}
      <button class="btn btn-primary" data-act="play">${t('play')}</button>`;
    wireSeg(actions, mode);
    actions.querySelector('[data-act="back"]').addEventListener('click', () => LG.app.goMenu());
    actions.querySelector('[data-act="play"]').addEventListener('click', () => LG.app.startMatch(mode, LG.state.menuDiff[mode]));
    view.appendChild(actions);

    app.appendChild(view);
  }

  /* ---------- Gameplay ---------- */

  function renderGame(app) {
    const m = LG.state.match;
    const round = m.rounds[m.index];
    const view = div('view game-wrap');

    const meta = div('round-meta');
    meta.innerHTML = `<span>${t('textOf', m.index + 1, m.rounds.length)}</span>
      <div class="progress-track"><div class="progress-fill" style="width:${(m.index / m.rounds.length) * 100}%"></div></div>`;
    view.appendChild(meta);

    const frame = div('text-frame');
    const card = div('text-card');
    card.setAttribute('lang', round.lang);
    card.textContent = round.text; // textContent keeps snippets inert and preserves \n via pre-line
    frame.appendChild(card);
    view.appendChild(frame);

    const answers = div('answers');
    answers.setAttribute('role', 'group');
    answers.setAttribute('aria-label', t('whichLang'));
    for (const lang of LG.MODES[m.mode].langs) {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.lang = lang;
      btn.innerHTML = `<span class="fl">${langFlag(lang)}</span><span>${langName(lang)}</span>`;
      btn.addEventListener('click', () => onAnswer(frame, answers, lang));
      answers.appendChild(btn);
    }

    const slot = div('next-slot');
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary next-btn';
    nextBtn.textContent = m.index === m.rounds.length - 1 ? t('seeResults') : t('next');
    nextBtn.addEventListener('click', () => LG.app.nextRound());
    slot.appendChild(nextBtn);
    answers.appendChild(slot);

    view.appendChild(answers);
    app.appendChild(view);

    // Re-render of an already-answered round (for instance after a language
    // switch): repaint the answered state instead of accepting a second guess.
    if (m.answers.length > m.index) {
      const a = m.answers[m.index];
      paintAnswered(frame, answers, a.guess, a.actual, a.guess === a.actual);
    }
  }

  function onAnswer(frame, answers, guess) {
    if (answers.classList.contains('locked')) return;
    const { correct, correctLang } = LG.game.answer(LG.state.match, guess);
    paintAnswered(frame, answers, guess, correctLang, correct);
    LG.app.updateHeaderBadges();
  }

  function paintAnswered(frame, answers, guess, correctLang, correct) {
    answers.classList.add('locked');
    answers.querySelectorAll('.answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.lang === correctLang) b.classList.add('is-correct');
      else if (b.dataset.lang === guess) b.classList.add('is-wrong');
    });

    const fb = div(`feedback-overlay ${correct ? 'ok' : 'ko'}`);
    fb.innerHTML = `<div class="fb-icon">${correct ? CHECK_SVG : CROSS_SVG}</div>
      <div class="fb-text">${correct ? t('correct') : t('incorrect')}</div>`;
    frame.appendChild(fb);

    answers.querySelector('.next-btn').classList.add('show');
  }

  /* ---------- Results ---------- */

  function renderResults(app, isNewBest) {
    const m = LG.state.match;
    const s = LG.game.summary(m);
    const langs = LG.MODES[m.mode].langs;
    const view = div('view results-view');

    const mult = LG.game.currentMultiplier(m);
    const hero = div('score-hero glass-card');
    const line = (label, value) => `<dt>${label}</dt><dd>${value}</dd>`;
    hero.innerHTML = `
      <div class="label">${t('finalScore')}</div>
      <div class="value">${m.final}</div>
      <div class="sub">${t('outOf', LG.game.MAX_SCORE)} · ${t(m.difficulty)}</div>
      <dl class="breakdown">
        ${line(t('resCorrect'), t('resCorrectVal', LG.game.correctCount(m), m.rounds.length))}
        ${line(t('resBase'), m.raw)}
        ${line(t('resTime'), LG.fmt.time(LG.game.elapsed(m)))}
        ${line(t('resMult'), LG.fmt.multiplier(mult, LG.state.uiLang))}
        ${line(t('resFinal'), m.final)}
      </dl>
      ${isNewBest ? `<span class="best-badge">${t('newBest')}</span>` : ''}`;
    view.appendChild(hero);

    const grid = div('results-grid');

    // Per-language accuracy
    const acc = div('panel glass-card');
    acc.innerHTML = `<h3>${t('accuracyByLang')}</h3>`;
    for (const lang of langs) {
      const { correct, total } = s.perLang[lang];
      const pct = total ? Math.round((correct / total) * 100) : 0;
      const row = div('acc-row');
      row.innerHTML = `
        <span class="fl">${langFlag(lang)}</span>
        <div><div class="nm">${langName(lang)}</div>
          <div class="acc-bar"><span style="width:${pct}%"></span></div></div>
        <span class="acc-num">${t('accLine', correct, total, pct)}</span>`;
      acc.appendChild(row);
    }
    grid.appendChild(acc);

    // Confusion matrix
    const cmPanel = div('panel glass-card');
    cmPanel.innerHTML = `<h3>${t('confusionMatrix')}</h3>`;
    cmPanel.appendChild(buildMatrix(s, langs, cmPanel));
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = t('cmHint');
    cmPanel.appendChild(hint);
    grid.appendChild(cmPanel);

    // Leaderboard, filled in once the request comes back
    const lbPanel = div('panel glass-card board-panel');
    lbPanel.innerHTML = `<h3>${TROPHY_SVG} ${t('topTen')}</h3>`;
    const lbBody = div('board-body');
    lbBody.textContent = t('lbLoading');
    lbPanel.appendChild(lbBody);
    grid.appendChild(lbPanel);
    loadResultsBoard(m, lbBody);

    view.appendChild(grid);

    const actions = div('results-actions');
    actions.append(
      button('btn btn-primary', t('playAgain'), () => LG.app.startMatch(m.mode, m.difficulty)),
      button('btn btn-ghost', t('backToMenu'), () => LG.app.goMenu()),
    );
    view.appendChild(actions);

    app.appendChild(view);
  }

  /* Fetch the board for this match and render the top ten plus the save control.
     Any failure leaves a plain "unavailable" message and nothing else breaks. */
  async function loadResultsBoard(match, container) {
    const payload = await LG.leaderboard.fetchBoard(match.mode, match.difficulty, { force: true });
    if (LG.state.match !== match || !container.isConnected) return; // player moved on
    paintResultsBoard(match, container, payload);
  }

  function paintResultsBoard(match, container, payload) {
    container.textContent = '';
    if (!payload.ok) {
      container.appendChild(div('board-note', t('lbUnavailable')));
      return;
    }

    const entries = payload.entries || [];
    if (!entries.length) {
      container.appendChild(div('board-note', t('lbEmpty')));
    } else {
      const list = div('board-list');
      entries.slice(0, LG.leaderboard.TOP_ON_RESULTS).forEach(e => list.appendChild(boardRow(e, match)));
      container.appendChild(list);
    }

    // Save control, or the reason there is none.
    if (match.savedRank != null) {
      container.appendChild(div('board-note saved', t('saved', match.savedRank)));
      return;
    }
    // A blank match never reaches the board, even while it has room to spare.
    if (match.final <= 0) {
      container.appendChild(div('board-note', t('notScored')));
      return;
    }
    const rank = LG.leaderboard.rankFor(entries, match.final, LG.game.elapsed(match));
    if (rank == null) {
      container.appendChild(div('board-note', t('notRanked')));
      return;
    }
    container.appendChild(button('btn btn-gold save-btn', t('saveScore', rank),
      () => showNameModal(match, container, rank)));
  }

  function boardRow(entry, match) {
    const row = div('board-row');
    if (match && match.savedRank === entry.rank) row.classList.add('mine');
    row.innerHTML = `<span class="rk">${entry.rank}</span><span class="nm"></span>
      <span class="sc">${entry.score}</span><span class="tm">${LG.fmt.time(entry.ms)}</span>`;
    row.querySelector('.nm').textContent = entry.name; // never as HTML
    return row;
  }

  /* ---------- Save a score ---------- */

  function showNameModal(match, container, estimatedRank) {
    const root = document.getElementById('modal-root');
    const backdrop = div('modal-backdrop');
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h3 class="modal-title">${t('saveTitle')}</h3>
        <p class="modal-hint">${t('saveHint')}</p>
        <input class="name-input" type="text" maxlength="16" placeholder="${t('namePlaceholder')}"
               autocomplete="off" spellcheck="false">
        <p class="modal-error" hidden></p>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="save">${t('save')}</button>
          <button class="btn btn-neutral" data-act="cancel">${t('cancel')}</button>
        </div>
      </div>`;

    const input = backdrop.querySelector('.name-input');
    const saveBtn = backdrop.querySelector('[data-act="save"]');
    const error = backdrop.querySelector('.modal-error');
    const close = () => backdrop.remove();

    input.value = LG.state.lastName || '';
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('[data-act="cancel"]').addEventListener('click', close);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });

    saveBtn.addEventListener('click', async () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      saveBtn.disabled = true;
      saveBtn.textContent = t('saving');
      error.hidden = true;

      const res = await LG.leaderboard.submit({
        mode: match.mode, difficulty: match.difficulty,
        name, score: match.final, ms: LG.game.elapsed(match),
      });

      if (!res.ok) {
        saveBtn.disabled = false;
        saveBtn.textContent = t('save');
        error.textContent = t('saveFailed');
        error.hidden = false;
        return;
      }

      LG.state.lastName = name;
      LG.app.save();
      match.savedRank = res.rank ?? estimatedRank;
      close();
      if (container.isConnected) paintResultsBoard(match, container, res);
    });

    root.appendChild(backdrop);
    input.focus();
    input.select();
  }

  /* ---------- Confusion matrix ---------- */

  /* Green on the diagonal, red off it, intensity by count. The numbers stay
     visible in every cell so colour is never the only encoding. */
  function buildMatrix(s, langs, panel) {
    const wrap = div('cm-wrap');
    const table = document.createElement('table');
    table.className = 'cm-table';

    const thead = `<tr>
        <th><span class="axis-label">${t('cmActual')} ↓</span><br><span class="axis-label">${t('cmGuessed')} →</span></th>
        ${langs.map(g => `<th data-col="${g}"><span class="fl">${langFlag(g)}</span>${langName(g).slice(0, 3)}.</th>`).join('')}
      </tr>`;

    const rows = langs.map(a => `<tr>
        <th data-row="${a}"><span class="fl">${langFlag(a)}</span>${langName(a).slice(0, 3)}.</th>
        ${langs.map(g => {
          const n = s.matrix[a][g];
          const alpha = n === 0 ? 0 : 0.16 + 0.5 * Math.min(n / 3, 1);
          const rgb = a === g ? '22,163,74' : '220,38,38';
          const style = n ? `background: rgba(${rgb}, ${alpha});` : 'color:#94a3b8;';
          return `<td class="cm-cell ${n ? 'clickable' : ''}" data-a="${a}" data-g="${g}" style="${style}"
                    title="${langName(a)} → ${langName(g)}: ${n}">${n}</td>`;
        }).join('')}
      </tr>`).join('');

    table.innerHTML = thead + rows;

    table.querySelectorAll('.cm-cell').forEach(td => {
      td.addEventListener('mouseenter', () => {
        table.querySelector(`th[data-row="${td.dataset.a}"]`).classList.add('hl');
        table.querySelector(`th[data-col="${td.dataset.g}"]`).classList.add('hl');
      });
      td.addEventListener('mouseleave', () => {
        table.querySelectorAll('th.hl').forEach(th => th.classList.remove('hl'));
      });
      if (td.classList.contains('clickable')) {
        td.addEventListener('click', () => showCellDetails(td, s, panel, table));
      }
    });

    wrap.appendChild(table);
    return wrap;
  }

  /* Click a cell to list the first line of each passage that landed there. */
  function showCellDetails(td, s, panel, table) {
    const old = panel.querySelector('.cm-details');
    const wasSelected = td.classList.contains('selected');
    table.querySelectorAll('.cm-cell.selected').forEach(c => c.classList.remove('selected'));
    if (old) old.remove();
    if (wasSelected) return; // second click closes it

    td.classList.add('selected');
    const { a, g } = td.dataset;
    const texts = s.cells[`${a}|${g}`] || [];
    const box = div('cm-details');
    box.innerHTML = `<div class="cm-details-title">${t('cmDetail', langName(a), langName(g), texts.length)}</div>`;
    for (const text of texts) {
      const p = document.createElement('p');
      p.className = 'excerpt';
      p.textContent = `« ${text.split('\n')[0]} »`;
      box.appendChild(p);
    }
    panel.appendChild(box);
  }

  /* ---------- Full leaderboard page ---------- */

  function renderBoard(app) {
    const { boardMode: mode, boardDiff: difficulty } = LG.state;
    const view = div('view board-view');

    const controls = div('board-controls');
    controls.innerHTML = `
      <div class="seg" role="group" aria-label="Difficulty">
        <button data-diff="easy" class="${difficulty === 'easy' ? 'active' : ''}">${t('easy')}</button>
        <button data-diff="hard" class="${difficulty === 'hard' ? 'active' : ''}">${t('hard')}</button>
      </div>
      <input class="search-input" type="search" placeholder="${t('searchName')}"
             autocomplete="off" spellcheck="false" value="${LG.state.boardQuery || ''}">`;
    controls.querySelectorAll('.seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (LG.state.boardDiff === btn.dataset.diff) return;
        LG.state.boardDiff = btn.dataset.diff;
        LG.app.render();
      });
    });
    view.appendChild(controls);

    const panel = div('board-page glass-card');
    const head = div('board-head');
    head.innerHTML = `<span class="rk">${t('colRank')}</span><span class="nm">${t('colName')}</span>
      <span class="sc">${t('colScore')}</span><span class="tm">${t('colTime')}</span>`;
    panel.appendChild(head);

    const body = div('board-scroll');
    body.appendChild(div('board-note', t('lbLoading')));
    panel.appendChild(body);
    view.appendChild(panel);

    const back = div('guide-actions');
    back.appendChild(button('btn btn-ghost', t('back'), () => LG.app.goMenu()));
    view.appendChild(back);

    app.appendChild(view);

    const search = controls.querySelector('.search-input');
    search.addEventListener('input', () => {
      LG.state.boardQuery = search.value;
      paintBoardRows(body, LG.state.boardEntries, search.value);
    });

    loadFullBoard(mode, difficulty, body, search);
  }

  async function loadFullBoard(mode, difficulty, body, search) {
    const payload = await LG.leaderboard.fetchBoard(mode, difficulty);
    if (LG.state.view !== 'board' || LG.state.boardMode !== mode
        || LG.state.boardDiff !== difficulty || !body.isConnected) return;
    if (!payload.ok) {
      LG.state.boardEntries = null;
      body.textContent = '';
      body.appendChild(div('board-note', t('lbUnavailable')));
      return;
    }
    LG.state.boardEntries = payload.entries || [];
    paintBoardRows(body, LG.state.boardEntries, search.value);
  }

  function paintBoardRows(body, entries, query) {
    body.textContent = '';
    if (!entries) { body.appendChild(div('board-note', t('lbUnavailable'))); return; }
    if (!entries.length) { body.appendChild(div('board-note', t('lbEmpty'))); return; }

    const needle = (query || '').trim().toLowerCase();
    const shown = needle ? entries.filter(e => e.name.toLowerCase().includes(needle)) : entries;
    if (!shown.length) { body.appendChild(div('board-note', t('noMatch'))); return; }

    for (const entry of shown) {
      const row = boardRow(entry, null);
      if (LG.state.lastName && entry.name === LG.state.lastName) row.classList.add('mine');
      body.appendChild(row);
    }
  }

  /* ---------- Quit confirmation modal ---------- */

  function showQuitModal() {
    const root = document.getElementById('modal-root');
    const backdrop = div('modal-backdrop');
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <p>${t('quitConfirm')}</p>
        <div class="modal-actions">
          <button class="btn btn-danger" data-act="quit">${t('quit')}</button>
          <button class="btn btn-neutral" data-act="cancel">${t('cancel')}</button>
        </div>
      </div>`;
    const close = () => backdrop.remove();
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('[data-act="cancel"]').addEventListener('click', close);
    backdrop.querySelector('[data-act="quit"]').addEventListener('click', () => { close(); LG.app.goMenu(); });
    root.appendChild(backdrop);
    backdrop.querySelector('[data-act="cancel"]').focus();
  }

  return { renderMenu, renderGuide, renderGame, renderResults, renderBoard, showQuitModal };
})();
