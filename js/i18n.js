/* LinguaGuess: namespace bootstrap, static metadata and interface copy (en/fr). */
window.LG = window.LG || {};
LG.data = { texts: {} };

/* The three game modes and their four target languages. */
LG.MODES = {
  slavic:  { langs: ['ru', 'uk', 'be', 'bg'] },
  romance: { langs: ['fr', 'es', 'it', 'pt'] },
  nordic:  { langs: ['sv', 'da', 'no', 'is'] },
};

/* Per-language display metadata (emoji flags keep the build dependency-free). */
LG.LANGS = {
  ru: { flag: '🇷🇺', name: { en: 'Russian',    fr: 'Russe' } },
  uk: { flag: '🇺🇦', name: { en: 'Ukrainian',  fr: 'Ukrainien' } },
  be: { flag: '🇧🇾', name: { en: 'Belarusian', fr: 'Biélorusse' } },
  bg: { flag: '🇧🇬', name: { en: 'Bulgarian',  fr: 'Bulgare' } },
  fr: { flag: '🇫🇷', name: { en: 'French',     fr: 'Français' } },
  es: { flag: '🇪🇸', name: { en: 'Spanish',    fr: 'Espagnol' } },
  it: { flag: '🇮🇹', name: { en: 'Italian',    fr: 'Italien' } },
  pt: { flag: '🇵🇹', name: { en: 'Portuguese', fr: 'Portugais' } },
  sv: { flag: '🇸🇪', name: { en: 'Swedish',    fr: 'Suédois' } },
  da: { flag: '🇩🇰', name: { en: 'Danish',     fr: 'Danois' } },
  no: { flag: '🇳🇴', name: { en: 'Norwegian',  fr: 'Norvégien' } },
  is: { flag: '🇮🇸', name: { en: 'Icelandic',  fr: 'Islandais' } },
};

/* Small formatters shared by the views. */
LG.fmt = {
  /* 214_000 → "3:34", 3_725_000 → "1:02:05". Hours appear only when there are
     any, so an ordinary match keeps its short m:ss form. A tab left open all
     night is rare but legal, and "1500:00" would be unreadable. */
  time(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60) % 60, ss = String(total % 60).padStart(2, '0');
    const hh = Math.floor(total / 3600);
    return hh ? `${hh}:${String(mm).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
  },
  /* 0.7071 → "×0.71" in English, "×0,71" in French. */
  multiplier(value, uiLang) {
    const text = value.toFixed(2);
    return '×' + (uiLang === 'fr' ? text.replace('.', ',') : text);
  },
};

LG.STRINGS = {
  en: {
    mainMenu: 'Main Menu',
    tagline: 'Read a short passage and work out which language it is. Three families, two levels of difficulty.',
    modeName: { slavic: 'Slavic Mode', romance: 'Romance Mode', nordic: 'Nordic Mode' },
    modeSub: { slavic: 'Cyrillic script', romance: 'Latin script', nordic: 'North Germanic' },

    guideTitle: m => `Guide · ${m}`,
    gameTitle: (m, d) => `${m} · ${d}`,
    resultsTitle: m => `Results · ${m}`,
    boardTitle: m => `Leaderboard · ${m}`,

    scoreLabel: n => `Score: ${n}`,
    elapsedLabel: t => `Elapsed: ${t}`,
    speedLabel: p => `speed ${p}%`,
    play: 'Play',
    guide: 'Guide',
    easy: 'Easy',
    hard: 'Hard',
    bestLabel: parts => `Best: ${parts}`,
    back: 'Back',
    next: 'Next',
    seeResults: 'See results',
    textOf: (i, n) => `Text ${i} / ${n}`,
    whichLang: 'Which language is this?',
    correct: 'Correct!',
    incorrect: 'Incorrect!',

    finalScore: 'Final score',
    outOf: n => `out of ${n}`,
    resCorrect: 'Correct answers',
    resBase: 'Base score',
    resTime: 'Time spent',
    resMult: 'Speed multiplier',
    resFinal: 'Final score',
    resCorrectVal: (x, y) => `${x} / ${y}`,
    newBest: '★ New best!',
    accuracyByLang: 'Accuracy by language',
    accLine: (x, y, z) => `${x} / ${y} correct (${z}%)`,
    confusionMatrix: 'Confusion matrix',
    cmHint: 'Rows are the real language, columns are your answer. Click a cell to read its texts.',
    cmActual: 'Actual',
    cmGuessed: 'Answered',
    cmDetail: (a, g, n) => `${n} ${a} text${n > 1 ? 's' : ''} you answered ${g}`,
    playAgain: 'Play Again',
    backToMenu: 'Back to Main Menu',
    quitConfirm: 'Are you sure you want to quit? Your progress will be lost.',
    quit: 'Quit',
    cancel: 'Cancel',

    leaderboard: 'Leaderboard',
    topTen: 'Top 10',
    lbLoading: 'Loading the leaderboard…',
    lbUnavailable: 'Leaderboard unavailable for now, please try again later.',
    lbEmpty: 'No score here yet. Yours could be the first.',
    saveScore: rank => `Save my score (#${rank})`,
    saveTitle: 'Enter your name',
    saveHint: 'It appears next to your score on the public leaderboard.',
    namePlaceholder: 'Your name',
    save: 'Save',
    saving: 'Saving…',
    saved: rank => `Saved. You are #${rank}.`,
    saveFailed: 'Your score could not be saved, please try again later.',
    notRanked: 'This score does not reach the top 100 yet.',
    notScored: 'A match without a single correct answer cannot be saved.',
    alreadySaved: 'Score already saved.',
    searchName: 'Search a name',
    noMatch: 'No name matches your search.',
    colRank: 'Rank',
    colName: 'Player',
    colScore: 'Score',
    colTime: 'Time',
  },

  fr: {
    mainMenu: 'Menu principal',
    tagline: 'Lisez un court passage et devinez de quelle langue il s’agit. Trois familles, deux niveaux de difficulté.',
    modeName: { slavic: 'Mode slave', romance: 'Mode roman', nordic: 'Mode nordique' },
    modeSub: { slavic: 'Écriture cyrillique', romance: 'Écriture latine', nordic: 'Langues scandinaves' },

    guideTitle: m => `Guide · ${m}`,
    gameTitle: (m, d) => `${m} · ${d}`,
    resultsTitle: m => `Résultats · ${m}`,
    boardTitle: m => `Classement · ${m}`,

    scoreLabel: n => `Score : ${n}`,
    elapsedLabel: t => `Temps écoulé : ${t}`,
    speedLabel: p => `rapidité ${p} %`,
    play: 'Jouer',
    guide: 'Guide',
    easy: 'Facile',
    hard: 'Difficile',
    bestLabel: parts => `Record : ${parts}`,
    back: 'Retour',
    next: 'Suivant',
    seeResults: 'Voir les résultats',
    textOf: (i, n) => `Texte ${i} / ${n}`,
    whichLang: 'Quelle est cette langue ?',
    correct: 'Correct !',
    incorrect: 'Incorrect !',

    finalScore: 'Score final',
    outOf: n => `sur ${n}`,
    resCorrect: 'Bonnes réponses',
    resBase: 'Score de base',
    resTime: 'Temps passé',
    resMult: 'Multiplicateur de rapidité',
    resFinal: 'Score final',
    resCorrectVal: (x, y) => `${x} / ${y}`,
    newBest: '★ Nouveau record !',
    accuracyByLang: 'Précision par langue',
    accLine: (x, y, z) => `${x} / ${y} correct (${z} %)`,
    confusionMatrix: 'Matrice de confusion',
    cmHint: 'Les lignes donnent la vraie langue, les colonnes votre réponse. Cliquez sur une case pour lire ses textes.',
    cmActual: 'Réelle',
    cmGuessed: 'Répondu',
    cmDetail: (a, g, n) => `${n} texte${n > 1 ? 's' : ''} en ${a} où vous avez répondu ${g}`,
    playAgain: 'Rejouer',
    backToMenu: 'Retour au menu',
    quitConfirm: 'Voulez-vous vraiment quitter ? Votre progression sera perdue.',
    quit: 'Quitter',
    cancel: 'Annuler',

    leaderboard: 'Classement',
    topTen: 'Top 10',
    lbLoading: 'Chargement du classement…',
    lbUnavailable: 'Classement indisponible pour le moment, veuillez réessayer plus tard.',
    lbEmpty: 'Aucun score ici pour l’instant. Le vôtre pourrait être le premier.',
    saveScore: rank => `Enregistrer mon score (n° ${rank})`,
    saveTitle: 'Entrez votre nom',
    saveHint: 'Il apparaîtra à côté de votre score dans le classement public.',
    namePlaceholder: 'Votre nom',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    saved: rank => `Score enregistré. Vous êtes n° ${rank}.`,
    saveFailed: 'Votre score n’a pas pu être enregistré, veuillez réessayer plus tard.',
    notRanked: 'Ce score n’atteint pas encore le top 100.',
    notScored: 'Une partie sans aucune bonne réponse ne peut pas être enregistrée.',
    alreadySaved: 'Score déjà enregistré.',
    searchName: 'Rechercher un nom',
    noMatch: 'Aucun nom ne correspond à votre recherche.',
    colRank: 'Rang',
    colName: 'Joueur',
    colScore: 'Score',
    colTime: 'Temps',
  },
};

/* t('key') / t('key', ...args) resolves against the active interface language. */
LG.t = function (key, ...args) {
  const v = LG.STRINGS[LG.state.uiLang][key];
  return typeof v === 'function' ? v(...args) : v;
};
