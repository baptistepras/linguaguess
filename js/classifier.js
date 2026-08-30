/* LinguaGuess: heuristic easy/hard classifier.
   Scores a snippet against its own language's discriminators: unique letters,
   signature digraphs and function words. High score ⇒ 'easy' (the passage wears
   its identity openly); low score ⇒ 'hard' (the player must rely on morphology
   and lexicon). The same rules drive tools/validate.mjs in Node.

   JS \b is ASCII-only, so whole-word matching uses \p{L} lookarounds instead,
   which work for Cyrillic and accented Latin alike. */
(function () {
  const browser = typeof window !== 'undefined';
  if (browser) window.LG = window.LG || {};

  /* Whole-word matcher for an alternation like 'что|это|же'. */
  const W = alt => new RegExp(`(?<!\\p{L})(?:${alt})(?!\\p{L})`, 'gu');
  /* Apostrophe inside a word (Ukrainian п’ять, French l’école…). */
  const APOS = /(?<=\p{L})[’'](?=\p{L})/gu;

  const LATIN = { re: /[a-zÀ-ɏ]/i, label: 'latin letter' };
  const CYRILLIC = { re: /[Ѐ-ӿ]/, label: 'cyrillic letter' };

  /* rules: { re, w, cap } counts matches (capped) × weight;
            { all: [re…], w } scores once when every regex is present.
     threshold: easy ⇔ score ≥ threshold.
     forbidden: characters that must never occur in this language's data. */
  const RULES = {

    /* ---------- Slavic (Cyrillic) ---------- */
    ru: {
      threshold: 5,
      rules: [
        { re: /ы/g, w: 0.5, cap: 4 },              // ы is near-unavoidable in Russian; low weight
        { re: /э/g, w: 2, cap: 2 },
        { re: /ё/g, w: 2, cap: 2 },
        { all: [/ы/, /и/], w: 0.5 },               // ы+и together occurs in no other mode language
        { re: W('что|это|очень|когда|только|если|чтобы|же|уже|есть'), w: 1, cap: 2 },
      ],
      forbidden: [{ re: /[іїєўґ]/, label: 'ukr/bel letter' }, { re: /[’']/, label: 'apostrophe' }, LATIN],
    },
    uk: {
      threshold: 5,
      rules: [
        { re: /ї/g, w: 3, cap: 2 },
        { re: /є/g, w: 2, cap: 2 },
        { re: /ґ/g, w: 3, cap: 1 },
        { re: APOS, w: 2, cap: 2 },
        { re: /і/g, w: 0.5, cap: 4 },
        { re: W('що|це|але|який|яка|дуже|бути|немає|також'), w: 1, cap: 2 },
      ],
      forbidden: [{ re: /[ыъэё]/, label: 'rus-only letter' }, LATIN],
    },
    be: {
      threshold: 5,
      rules: [
        { re: /ў/g, w: 0.75, cap: 4 },             // ў is pervasive in Belarusian; density decides
        { all: [/і/, /ы/], w: 1 },                 // і+ы together is Belarusian alone
        { re: /гэт/g, w: 2, cap: 1 },
        { re: /э/g, w: 1, cap: 1 },
        { re: APOS, w: 1, cap: 1 },
        { re: W('што|вельмі|як|яго|яна|была|каб'), w: 1, cap: 1 },
      ],
      forbidden: [{ re: /[иъїєщ]/, label: 'non-belarusian letter' },
                  { re: /[аеёіоуыэюя] у/, label: 'у after vowel (must be ў)' }, LATIN],
    },
    bg: {
      threshold: 5.5,
      rules: [
        { re: /ъ/g, w: 0.6, cap: 8 },              // ъ is everywhere in Bulgarian; density decides
        { re: /(?<=\p{L}\p{L})(?:ът|ят)(?!\p{L})/gu, w: 1.5, cap: 2 },  // definite article suffix
        { re: W('това|като|който|която|защото|много|може|няма'), w: 1, cap: 2 },
      ],
      forbidden: [{ re: /[ыэіїўё]/, label: 'non-bulgarian letter' }, LATIN],
    },

    /* ---------- Romance (Latin) ---------- */
    fr: {
      threshold: 5,
      rules: [
        { re: /[œ]/g, w: 3, cap: 1 },
        { re: /[ëîû]/g, w: 2, cap: 2 },
        { re: /ê/g, w: 1.5, cap: 2 },
        { all: [/ç/, /è/], w: 2 },                 // ç+è: pt has ç, it has è, only fr has both
        { re: /eau/g, w: 1, cap: 2 },
        { re: /aux(?!\p{L})/gu, w: 1, cap: 2 },
        { re: /è/g, w: 1, cap: 2 },
        { re: /(?<!\p{L})[ldcjs][’'](?=\p{L})/gu, w: 0.5, cap: 4 },
        { re: W('les|des|dans|est|avec|pour|mais|sont|nous|vous'), w: 0.5, cap: 4 },
      ],
      forbidden: [{ re: /[¿¡ñãõåäøþð]/, label: 'non-french char' }, CYRILLIC],
    },
    es: {
      threshold: 5,
      rules: [
        { re: /[¿¡]/g, w: 3, cap: 2 },
        { re: /ñ/g, w: 2, cap: 2 },
        { re: /í/g, w: 0.5, cap: 2 },
        { re: /ó/g, w: 0.5, cap: 2 },
        { re: /ll/g, w: 0.5, cap: 2 },
        { re: W('que|el|los|las|una|pero|más|cuando|hay|muy'), w: 0.25, cap: 4 },
      ],
      forbidden: [{ re: /[çàèòêôîûœãõ]/, label: 'non-spanish char' }, CYRILLIC],
    },
    it: {
      threshold: 5,
      rules: [
        { re: /ò/g, w: 2, cap: 2 },
        { re: /ì/g, w: 2, cap: 2 },
        { re: W('è'), w: 2, cap: 2 },              // standalone è = "is", uniquely Italian here
        { re: W('gli|degli|perché|più|così'), w: 2, cap: 2 },
        { re: /zz/g, w: 0.5, cap: 2 },
        { re: /cch|gghi/g, w: 0.5, cap: 1 },
        { re: /(?<!\p{L})(?:un|dell|all|nell|quest|d|l)[’'](?=\p{L})/gu, w: 0.5, cap: 2 },
        { re: W('che|di|non|per|con|una|sono|questo'), w: 0.5, cap: 4 },
      ],
      forbidden: [{ re: /[áíúñçãõ¿¡œ]/, label: 'non-italian char' }, CYRILLIC],
    },
    pt: {
      threshold: 5,
      rules: [
        { re: /ã/g, w: 2, cap: 3 },
        { re: /õ/g, w: 2, cap: 2 },
        { re: /[êâô]/g, w: 1, cap: 2 },
        { re: /ç/g, w: 1, cap: 2 },
        { re: /(?<=\p{L})-(?:se|lhe|lhes|lo|la|los|las|nos|me)(?!\p{L})/gu, w: 2, cap: 2 },
        { re: W('uma|com|para|mais|muito|já|também|quando'), w: 0.5, cap: 4 },
      ],
      forbidden: [{ re: /[èòìñ¿¡œë]/, label: 'non-portuguese char' }, CYRILLIC],
    },

    /* ---------- Nordic (Latin) ---------- */
    sv: {
      threshold: 4.75,
      rules: [
        { re: /ä/g, w: 0.75, cap: 4 },             // ä is everywhere in Swedish; density decides
        { all: [/å/, /ö/], w: 1 },                 // å+ö without æ/ø ⇒ Swedish
        { re: /ö/g, w: 0.25, cap: 2 },
        { re: W('och|att|är|inte|på|som|för|med|ett|mycket'), w: 0.25, cap: 4 },
      ],
      forbidden: [{ re: /[æøðþ]/, label: 'non-swedish char' }, CYRILLIC],
    },
    da: {
      threshold: 5,
      rules: [
        { re: W('af'), w: 2, cap: 2 },
        { re: W('meget|hvad|hvor|hvordan|efter|også|mand|når|blev'), w: 1.5, cap: 3 },
        { re: W('mig|dig|sig|jeg'), w: 1, cap: 2 },
        { re: /øj/g, w: 1, cap: 2 },
        { re: /[æøå]/g, w: 0.5, cap: 4 },
      ],
      forbidden: [{ re: /[äöðþ]/, label: 'non-danish char' }, CYRILLIC],
    },
    no: {
      threshold: 5,
      rules: [
        { re: W('av'), w: 2, cap: 2 },
        { re: W('mye|etter|hva|hvordan|fra|noe|mange|blir|både'), w: 1.5, cap: 3 },
        { re: W('meg|deg|seg|jeg|ikke'), w: 1, cap: 2 },
        { re: W('ikkje|frå|kva|noko|berre'), w: 2, cap: 2 },   // Nynorsk signatures
        { re: /[æøå]/g, w: 0.5, cap: 4 },
      ],
      forbidden: [{ re: /[äöðþ]/, label: 'non-norwegian char' }, CYRILLIC],
    },
    is: {
      threshold: 5.5,
      rules: [
        { re: /þ/g, w: 2, cap: 3 },
        { re: /æ/g, w: 0.5, cap: 3 },              // æ/ö are common; only density separates
        { re: /ö/g, w: 0.5, cap: 2 },
        { re: /ý/g, w: 1, cap: 2 },
        { re: /ð/g, w: 0.5, cap: 4 },
        { re: /[áíúé]/g, w: 0.25, cap: 4 },
        { re: W('og|að|er|ekki|við|það'), w: 0.25, cap: 2 },
      ],
      forbidden: [{ re: /[åäø]/, label: 'non-icelandic char' }, CYRILLIC],
    },
  };

  function classify(text, lang) {
    const cfg = RULES[lang];
    const t = text.toLowerCase();
    let score = 0;
    for (const rule of cfg.rules) {
      if (rule.all) {
        if (rule.all.every(re => re.test(t))) score += rule.w;
      } else {
        const n = (t.match(rule.re) || []).length;
        score += Math.min(n, rule.cap) * rule.w;
      }
    }
    return { score, tier: score >= cfg.threshold ? 'easy' : 'hard' };
  }

  const api = { RULES, classify };
  if (browser) window.LG.classifier = api;
  if (typeof module !== 'undefined') module.exports = api; // reused by tools/validate.mjs
})();
