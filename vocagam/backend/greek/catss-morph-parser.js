function parseLXXMorphCode(code) {
    const posMap = {
      'A': 'Adjective',
      'C': 'Conjunction',
      'D': 'Demonstrative Pronoun',
      'I': 'Interrogative/Indefinite Pronoun',
      'N': 'Noun',
      'P': 'Preposition',
      'R': 'Relative Pronoun',
      'T': 'Definite Article',
      'V': 'Verb',
      'X': 'Negative Particle',
      'Q': 'Correlative/Reciprocal Pronoun',
      'M': 'Numeral',
      'S': 'Pronominal Suffix',
      'F': 'Interjection'
    };
  
    const caseMap = {
      'N': 'Nominative',
      'G': 'Genitive',
      'D': 'Dative',
      'A': 'Accusative',
      'V': 'Vocative'
    };

    const declenstionMap = {
        '1': '1st Declension',
        '1A': '1st Declension (Alpha)',
        '1M': '1st Declension (Masculine with nominative in -HS)',
        '1S': '1st Declension (Stem in -H, nominative in -A, feminine)',
        '1T': '1st Declension (Masculine with nominative in -AS)',
        '2': '2nd Declension',
        '2N': '2nd Declension (Neuters in -ON)',
        '3': '3rd Declension',
    }
  
    const genderMap = {
      'M': 'Masculine',
      'F': 'Feminine',
      'N': 'Neuter'
    };
  
    const numberMap = {
      'S': 'Singular',
      'P': 'Plural',
      'D': 'Dual'
    };
  
    const tenseMap = {
      'P': 'Present',
      'I': 'Imperfect',
      'F': 'Future',
      'A': 'Aorist',
      'X': 'Perfect',
      'Y': 'Pluperfect'
    };

    const verbStemMap = {
        '1': 'regular',
        '2': 'contract-eo',
        '3': 'contract-ao',
        '4': 'contract-ow',
        '5': 'mi',
        '6': 'mi-a',
        '7': 'mi-e',
        '8': 'mi-o',
        '9': 'eimi',
        'A': '1st-aorist-active',
        'B': '2nd-aorist-active-regular',
        'Z': '2nd-aorist-active-irregular', 
        'H': 'aorist-mi-eta',
        'E': 'aorist-mi-epsilon',
        'O': 'aorist-mi-omicron',
        'C': '1st-aorist-future-passive-q',
        'D': '2nd-aorist-future-passive',
        'V': 'aorist-future-passive-labial',
        'S': 'aorist-future-passive-dental',
        "Q": 'aorist-aorist-future-passive-guttural',
        "X": 'perfect-active',
        'M': 'perfect-middle',
        'P': 'labial-perfect-middle',
        'T': 'dental-perfect-middle',
        'K': 'guttural-perfect-middle',
        'F': 'regular-future',
        'F2': 'liquid-type-future',
        'F3': '',
        'FX': 'future-perfect'
    }
  
    const voiceMap = {
      'A': 'Active',
      'M': 'Middle',
      'P': 'Passive',
      'E': 'Middle or Passive',
      'D': 'Middle Deponent',
      'O': 'Passive Deponent',
      'N': 'Middle or Passive Deponent',
      'Q': 'Impersonal Active'
    };
  
    const moodMap = {
      'I': 'Indicative',
      'S': 'Subjunctive',
      'O': 'Optative',
      'M': 'Imperative',
      'N': 'Infinitive',
      'P': 'Participle'
    };
  
    const personMap = {
      '1': '1st Person',
      '2': '2nd Person',
      '3': '3rd Person'
    };
  
    const parts = code.split('-');
    const mainPOS = parts[0];
    const info = { raw: code };
  
    // Handle verbs
    if (mainPOS.startsWith('V')) {
        // console.log(mainPOS, parts[1])
        // throw new Error('check')

      info.partOfSpeech = posMap['V'];
      if (parts[0]) {
        const [_, stemType, augment] = parts[1].split('');
        info.stemType = verbStemMap[stemType];
        info.augmented = augment === 'I';

        // const [tense, voice, mood] = parts[1].split('');
        // info.tense = tenseMap[tense];
        // info.voice = voiceMap[voice];
        // info.mood = moodMap[mood];
      }
      if (parts[1]) {
        // const [person, gender, number] = parts[2].split('');
        const [tense, voice, mood, person, number, gender] = parts[1].split('');
        info.tense = tenseMap[tense];
        info.voice = voiceMap[voice];
        info.mood = moodMap[mood];
        info.person = personMap[person];
        info.gender = genderMap[gender];
        info.number = numberMap[number];
      }
    }

    // Handle Nouns
    else if (mainPOS.startsWith('N')) {
        info.partOfSpeech = posMap[mainPOS[0]];
        if (parts[1]) {
          const [caseCode, numberCode, genderCode] = parts[1].split('');
          info.case = caseMap[caseCode];
          info.gender = genderMap[genderCode];
          info.number = numberMap[numberCode];

          const [_, declension, stemType] = mainPOS.split('');
            info.declension = declenstionMap[declension];
            info.stemType = declenstionMap[declension + stemType];
        }
    }

    // Handle adjectives, etc.
    else if (['A', 'T', 'D', 'R', 'I', 'Q', 'M'].includes(mainPOS[0])) {
      info.partOfSpeech = posMap[mainPOS[0]];
      if (parts[1]) {
        const [caseCode, numberCode, genderCode] = parts[1].split('');
        info.case = caseMap[caseCode];
        info.gender = genderMap[genderCode];
        info.number = numberMap[numberCode];
      }
    }
  
    // Handle indeclinables
    else if (posMap[mainPOS[0]]) {
      info.partOfSpeech = posMap[mainPOS[0]];
    }
  
    return info;
}

module.exports = {
  parseLXXMorphCode
};
