/* LinguaGuess: bilingual (en/fr) explanation content for the three modes:
   signature letters, common words and recognition tricks per language. */
window.LG = window.LG || {};

LG.guides = {

  slavic: {
    intro: {
      en: 'All four languages use the Cyrillic alphabet, but each one has letters the others never use. Look for those first. When they are missing, fall back on the small words and the endings.',
      fr: 'Les quatre langues utilisent l’alphabet cyrillique, mais chacune possède des lettres que les autres n’emploient jamais. Cherchez-les en premier. Quand elles manquent, appuyez-vous sur les petits mots et les terminaisons.',
    },
    langs: {
      ru: {
        chips: ['ы', 'э', 'ё', 'ъ'],
        words: ['что', 'это', 'очень', 'когда', 'же'],
        notes: {
          en: [
            'Uses both <b>ы</b> and <b>и</b> in the same text, which no other language in this set does.',
            '<b>э</b> and <b>ё</b> are strong Russian signals, as in это and ещё, though printed texts often write е instead of ё.',
            'Never uses і, ї, є, ў, or an apostrophe inside a word.',
            '<b>ъ</b> shows up rarely, only as a separator in words like объект, never as a vowel.',
          ],
          fr: [
            'Utilise à la fois <b>ы</b> et <b>и</b> dans le même texte, ce qu’aucune autre langue de la série ne fait.',
            '<b>э</b> et <b>ё</b> sont de bons indices russes, comme dans это et ещё, même si l’imprimé écrit souvent е à la place de ё.',
            'N’emploie jamais і, ї, є, ў, ni d’apostrophe à l’intérieur d’un mot.',
            '<b>ъ</b> apparaît rarement, uniquement comme séparateur dans des mots comme объект, jamais comme voyelle.',
          ],
        },
      },
      uk: {
        chips: ['і', 'ї', 'є', 'ґ', '’'],
        words: ['що', 'це', 'дуже', 'але', 'який'],
        notes: {
          en: [
            '<b>ї</b> and <b>є</b> exist only in Ukrainian. A single ї settles the question.',
            'Combines <b>і</b> with <b>и</b>. Belarusian has і but never и.',
            'Apostrophes inside words are typical, as in п’ять or сім’я.',
            'Never uses ы, ъ, э or ё.',
          ],
          fr: [
            '<b>ї</b> et <b>є</b> n’existent qu’en ukrainien. Un seul ї suffit à trancher.',
            'Combine <b>і</b> avec <b>и</b>. Le biélorusse a і mais jamais и.',
            'Les apostrophes à l’intérieur des mots sont typiques, comme dans п’ять ou сім’я.',
            'N’emploie jamais ы, ъ, э ni ё.',
          ],
        },
      },
      be: {
        chips: ['ў', 'і', 'ы', 'э'],
        words: ['што', 'гэта', 'вельмі', 'як', 'каб'],
        notes: {
          en: [
            '<b>ў</b>, the short u, belongs to Belarusian alone.',
            'Uses <b>і</b> together with <b>ы</b>. Ukrainian has і without ы, Russian has ы without і.',
            'The word <b>гэта</b>, meaning this, gives it away. Russian says это, Ukrainian це.',
            'Never uses и, ъ or щ, which it writes as шч.',
          ],
          fr: [
            '<b>ў</b>, le u bref, n’appartient qu’au biélorusse.',
            'Emploie <b>і</b> avec <b>ы</b>. L’ukrainien a і sans ы, le russe a ы sans і.',
            'Le mot <b>гэта</b>, qui veut dire ceci, le trahit. Le russe dit это, l’ukrainien це.',
            'N’emploie jamais и, ъ ni щ, qu’il écrit шч.',
          ],
        },
      },
      bg: {
        chips: ['ъ', '-ът', '-ят', 'щ'],
        words: ['това', 'като', 'който', 'много', 'няма'],
        notes: {
          en: [
            '<b>ъ</b> is a full vowel here and turns up constantly, as in първи, къща or пътят.',
            'The definite article is glued to the noun: град<b>ът</b>, ден<b>ят</b>, жена<b>та</b>, дете<b>то</b>.',
            'It is the only Slavic language here without case endings, so the word order feels plainer.',
            'Never uses ы, э, і, ї, ў or ё.',
          ],
          fr: [
            '<b>ъ</b> y est une vraie voyelle et revient sans arrêt, comme dans първи, къща ou пътят.',
            'L’article défini est collé au nom : град<b>ът</b>, ден<b>ят</b>, жена<b>та</b>, дете<b>то</b>.',
            'C’est la seule langue slave de la série sans déclinaisons, l’ordre des mots paraît donc plus simple.',
            'N’emploie jamais ы, э, і, ї, ў ni ё.',
          ],
        },
      },
    },
    compare: {
      en: [
        'A ї or a є means Ukrainian, straight away.',
        'A ў means Belarusian, straight away.',
        'Plenty of ъ inside ordinary words means Bulgarian.',
        'ы and и together, with no і, means Russian.',
        'Hard texts hide the rare letters. Compare the small words instead: что for Russian, що for Ukrainian, што for Belarusian, това and като for Bulgarian.',
        'Remember that и never appears in Belarusian, and і never in Russian or Bulgarian.',
      ],
      fr: [
        'Un ї ou un є, c’est de l’ukrainien, tout de suite.',
        'Un ў, c’est du biélorusse, tout de suite.',
        'Beaucoup de ъ dans des mots ordinaires, c’est du bulgare.',
        'ы et и ensemble, sans і, c’est du russe.',
        'Les textes difficiles cachent les lettres rares. Comparez alors les petits mots : что en russe, що en ukrainien, што en biélorusse, това et като en bulgare.',
        'Rappelez-vous que и n’apparaît jamais en biélorusse, et і jamais en russe ni en bulgare.',
      ],
    },
  },

  romance: {
    intro: {
      en: 'Four Latin-script cousins. Accents and special letters are the quick way in. When a passage has almost none, look at the articles, the contractions and the word endings.',
      fr: 'Quatre cousines à écriture latine. Les accents et les lettres spéciales sont la voie rapide. Quand un passage n’en a presque pas, regardez les articles, les contractions et les terminaisons.',
    },
    langs: {
      fr: {
        chips: ['ç', 'è', 'ê', 'œ', 'ë', 'û'],
        words: ['les', 'des', 'est', 'dans', 'd’', 'l’'],
        notes: {
          en: [
            'The only language here that combines <b>ç</b> with <b>è</b>. The letter œ, as in cœur or sœur, is French and nothing else.',
            'Circumflexes land on every vowel, â ê î ô û, and the groups <b>eau</b> and <b>aux</b> are everywhere.',
            'Contractions l’, d’, c’, j’ run through every sentence. Italian shares them, Spanish and Portuguese do not.',
            'The plural article <b>les</b> and the ending -tion are good markers. Portuguese writes -ção, Italian writes -zione.',
          ],
          fr: [
            'Seule langue de la série à combiner <b>ç</b> et <b>è</b>. La lettre œ, dans cœur ou sœur, est française et rien d’autre.',
            'Les circonflexes se posent sur toutes les voyelles, â ê î ô û, et les groupes <b>eau</b> et <b>aux</b> sont partout.',
            'Les contractions l’, d’, c’, j’ traversent chaque phrase. L’italien les partage, l’espagnol et le portugais non.',
            'L’article pluriel <b>les</b> et la finale -tion sont de bons repères. Le portugais écrit -ção, l’italien -zione.',
          ],
        },
      },
      es: {
        chips: ['ñ', '¿', '¡', 'á', 'ó'],
        words: ['el', 'los', 'las', 'que', 'muy'],
        notes: {
          en: [
            'The upside-down <b>¿</b> and <b>¡</b> exist in Spanish only.',
            '<b>ñ</b> is the classic giveaway, as in año, niño or mañana.',
            'Acute accents and nothing else. You will never see à, è, ç, ã or a circumflex.',
            'Watch for the articles el, los and las, and for the double <b>ll</b> in llave or calle.',
          ],
          fr: [
            'Les signes inversés <b>¿</b> et <b>¡</b> n’existent qu’en espagnol.',
            '<b>ñ</b> est l’indice classique, dans año, niño ou mañana.',
            'Des accents aigus et rien d’autre. Vous ne verrez jamais à, è, ç, ã ni de circonflexe.',
            'Repérez les articles el, los et las, et le double <b>ll</b> de llave ou calle.',
          ],
        },
      },
      it: {
        chips: ['è', 'ò', 'ì', 'zz', 'gli'],
        words: ['che', 'di', 'non', 'più', 'perché'],
        notes: {
          en: [
            'Grave accents sit on final vowels, as in città, però, così and più. Here, <b>ò</b> and <b>ì</b> belong to Italian only.',
            'The word <b>è</b> standing alone, meaning is, is a very Italian sight.',
            'Double consonants turn up in almost every sentence: pizza, tutto, bello, anno.',
            '<b>gli</b> appears as a word of its own, and nearly every word ends in a vowel.',
          ],
          fr: [
            'Les accents graves se posent sur les voyelles finales, comme dans città, però, così et più. Ici, <b>ò</b> et <b>ì</b> n’appartiennent qu’à l’italien.',
            'Le mot <b>è</b> tout seul, qui veut dire est, est très reconnaissable.',
            'Les consonnes doubles reviennent dans presque chaque phrase : pizza, tutto, bello, anno.',
            '<b>gli</b> apparaît comme mot à part entière, et presque tous les mots finissent par une voyelle.',
          ],
        },
      },
      pt: {
        chips: ['ã', 'õ', 'ção', 'ê', 'ô'],
        words: ['não', 'uma', 'com', 'muito', 'já'],
        notes: {
          en: [
            'The nasal tildes <b>ã</b> and <b>õ</b>, in não, mão or lições, exist in no other Romance language.',
            'The endings <b>-ção</b> and <b>-ões</b>, as in estação or tradições, are unmistakable.',
            'Pronouns hang off the verb with a hyphen: chama-se, dá-lhe, vê-los.',
            'It shares ç with French, adds â ê ô, and never uses è or ò.',
          ],
          fr: [
            'Les tildes nasaux <b>ã</b> et <b>õ</b>, dans não, mão ou lições, n’existent dans aucune autre langue romane.',
            'Les finales <b>-ção</b> et <b>-ões</b>, comme dans estação ou tradições, ne trompent pas.',
            'Les pronoms s’accrochent au verbe avec un trait d’union : chama-se, dá-lhe, vê-los.',
            'Il partage ç avec le français, ajoute â ê ô, et n’utilise jamais è ni ò.',
          ],
        },
      },
    },
    compare: {
      en: [
        '¿ or ñ means Spanish. ã or õ means Portuguese. œ, or ç next to è, means French. ò, ì or a lone è means Italian.',
        'French and Italian contract before a vowel, as in l’eau and l’acqua. Spanish and Portuguese never do.',
        'The word for the: les in French, el and los in Spanish, il and gli in Italian, o and os in Portuguese.',
        'The word for not: ne … pas in French, no in Spanish, non in Italian, não in Portuguese.',
        'On a passage without accents, read the endings. Italian words end in vowels, French in silent consonants like -ent or -eux, Portuguese in -o, -a or -em, Spanish in -o, -a or -os.',
      ],
      fr: [
        '¿ ou ñ, c’est de l’espagnol. ã ou õ, du portugais. œ, ou ç à côté de è, du français. ò, ì ou un è isolé, de l’italien.',
        'Le français et l’italien contractent devant une voyelle, comme dans l’eau et l’acqua. L’espagnol et le portugais jamais.',
        'Le mot pour « le » : les en français, el et los en espagnol, il et gli en italien, o et os en portugais.',
        'La négation : ne … pas en français, no en espagnol, non en italien, não en portugais.',
        'Sur un passage sans accents, lisez les finales. L’italien finit par des voyelles, le français par des consonnes muettes comme -ent ou -eux, le portugais par -o, -a ou -em, l’espagnol par -o, -a ou -os.',
      ],
    },
  },

  nordic: {
    intro: {
      en: 'Icelandic and Swedish carry letters of their own. Danish and Norwegian share their whole alphabet, so that pair comes down to vocabulary. This is the subtlest of the three modes.',
      fr: 'L’islandais et le suédois ont des lettres bien à eux. Le danois et le norvégien partagent tout leur alphabet, ce duo se joue donc au vocabulaire. C’est le plus subtil des trois modes.',
    },
    langs: {
      sv: {
        chips: ['ä', 'ö', 'å'],
        words: ['och', 'inte', 'är', 'på', 'mycket'],
        notes: {
          en: [
            'Uses <b>ä</b> and <b>ö</b>, never æ or ø. One ä rules out Danish and Norwegian on the spot.',
            'The word for and is <b>och</b>. Danish and Norwegian write og.',
            'The word for not is <b>inte</b>, where Danish and Norwegian write ikke.',
            'The word for is is <b>är</b>, where Danish and Norwegian write er.',
          ],
          fr: [
            'Emploie <b>ä</b> et <b>ö</b>, jamais æ ni ø. Un seul ä élimine immédiatement le danois et le norvégien.',
            'Le mot pour « et » est <b>och</b>. Le danois et le norvégien écrivent og.',
            'La négation est <b>inte</b>, là où le danois et le norvégien écrivent ikke.',
            'Le verbe « est » se dit <b>är</b>, là où le danois et le norvégien écrivent er.',
          ],
        },
      },
      da: {
        chips: ['æ', 'ø', 'å', 'øj'],
        words: ['af', 'meget', 'hvad', 'efter', 'også'],
        notes: {
          en: [
            'Shares æ, ø and å with Norwegian, so the letters alone will not separate them.',
            'The word for of is <b>af</b>, where Norwegian writes av.',
            'The word for a lot is <b>meget</b>, where Norwegian prefers mye.',
            'Look for <b>hvad</b>, <b>efter</b> and <b>mand</b> against Norwegian hva, etter and mann, and for the pair <b>øj</b> in øje or høj against Norwegian øy.',
          ],
          fr: [
            'Partage æ, ø et å avec le norvégien, les lettres seules ne suffisent donc pas.',
            'Le mot pour « de » est <b>af</b>, là où le norvégien écrit av.',
            'Le mot pour « beaucoup » est <b>meget</b>, là où le norvégien préfère mye.',
            'Cherchez <b>hvad</b>, <b>efter</b> et <b>mand</b> face au norvégien hva, etter et mann, et le groupe <b>øj</b> de øje ou høj face au øy norvégien.',
          ],
        },
      },
      no: {
        chips: ['æ', 'ø', 'å', 'øy'],
        words: ['av', 'mye', 'hva', 'etter', 'ikke'],
        notes: {
          en: [
            'Same alphabet as Danish, so decide on the words: <b>av</b>, <b>mye</b>, <b>hva</b>, <b>etter</b>, <b>mann</b>.',
            'Norwegian prefers the ending -sjon in stasjon, where Danish keeps -tion in station.',
            'It doubles final consonants in mann and takk, where Danish writes mand and tak.',
            'Some texts are in Nynorsk, with <b>ikkje</b>, <b>frå</b>, <b>kva</b> or <b>noko</b>. Those forms are always Norwegian.',
          ],
          fr: [
            'Même alphabet que le danois, tranchez donc sur les mots : <b>av</b>, <b>mye</b>, <b>hva</b>, <b>etter</b>, <b>mann</b>.',
            'Le norvégien préfère la finale -sjon dans stasjon, là où le danois garde -tion dans station.',
            'Il double les consonnes finales dans mann et takk, là où le danois écrit mand et tak.',
            'Certains textes sont en nynorsk, avec <b>ikkje</b>, <b>frå</b>, <b>kva</b> ou <b>noko</b>. Ces formes sont toujours norvégiennes.',
          ],
        },
      },
      is: {
        chips: ['þ', 'ð', 'æ', 'ý', 'ö'],
        words: ['og', 'að', 'er', 'ekki', 'við'],
        notes: {
          en: [
            '<b>þ</b>, called thorn, and <b>ð</b>, called eth, survive in Icelandic alone. Either one ends the debate.',
            'Accents are plentiful, á é í ó ú ý, alongside æ and ö, but you will never see å or ø.',
            'Words get long and compound, and ll or nn often double, as in fjall and steinn.',
            'It looks archaic on purpose, since the grammar kept its four cases.',
          ],
          fr: [
            '<b>þ</b>, appelé thorn, et <b>ð</b>, appelé eth, ne survivent qu’en islandais. L’un ou l’autre clôt le débat.',
            'Les accents sont nombreux, á é í ó ú ý, aux côtés de æ et ö, mais vous ne verrez jamais å ni ø.',
            'Les mots s’allongent et se composent, et ll ou nn se doublent souvent, comme dans fjall et steinn.',
            'L’aspect archaïque est voulu, la grammaire ayant gardé ses quatre cas.',
          ],
        },
      },
    },
    compare: {
      en: [
        'A þ or a ð means Icelandic, instantly.',
        'An ä means Swedish. An æ or a ø means Danish or Norwegian.',
        'Danish against Norwegian is pure vocabulary: af or av, meget or mye, hvad or hva, efter or etter, mand or mann, øj or øy.',
        'The word for not: inte in Swedish, ikke in Danish and Norwegian, ikkje in Nynorsk, ekki in Icelandic.',
        'When you hesitate between Danish and Norwegian, hunt for a single af or av. There is nearly always one in the passage.',
      ],
      fr: [
        'Un þ ou un ð, c’est de l’islandais, immédiatement.',
        'Un ä, c’est du suédois. Un æ ou un ø, c’est du danois ou du norvégien.',
        'Danois contre norvégien, c’est du pur vocabulaire : af ou av, meget ou mye, hvad ou hva, efter ou etter, mand ou mann, øj ou øy.',
        'La négation : inte en suédois, ikke en danois et en norvégien, ikkje en nynorsk, ekki en islandais.',
        'Quand vous hésitez entre danois et norvégien, cherchez un simple af ou av. Il y en a presque toujours un dans le passage.',
      ],
    },
  },
};
