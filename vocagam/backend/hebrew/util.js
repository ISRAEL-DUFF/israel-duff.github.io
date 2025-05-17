function parseMorphHB(code) {
    const [langType, pos, morph] = code.split('/');
  
    const language = {
      'H': 'Hebrew',
      'A': 'Aramaic',
    }[langType?.[0]] || 'Unknown';
  
    const formType = {
      'C': 'Consonantal',
      'V': 'Vocalized',
      'T': 'Transliterated',
      'M': 'Morphological',
      'S': 'Syntactical',
    }[langType?.[1]] || 'Unknown';
  
    const partOfSpeech = {
      'A': 'Article',
      'C': 'Conjunction',
      'D': 'Adjective',
      'M': 'Particle',
      'N': 'Proper Noun',
      'P': 'Pronoun',
      'R': 'Noun',
      'S': 'Subordinating Conjunction',
      'T': 'Preposition',
      'V': 'Verb',
      'X': 'Other/Unclassified',
    }[pos] || 'Unknown';
  
    function parseNounMorph(m) {
      if (!m || m.length < 5) return {};
      return {
        type: { 'c': 'Common', 'p': 'Proper' }[m[1]] || 'Unknown',
        gender: { 'm': 'Masculine', 'f': 'Feminine', 'c': 'Common gender' }[m[2]] || 'Unknown',
        number: { 's': 'Singular', 'd': 'Dual', 'p': 'Plural' }[m[3]] || 'Unknown',
        state: { 'a': 'Absolute', 'c': 'Construct', 'd': 'Determined' }[m[4]] || 'Unknown',
      };
    }
  
    function parseVerbMorph(m) {
      if (!m || m.length < 6) return {};
      return {
        stem: {
          'q': 'Qal',
          'n': 'Niphal',
          'p': 'Piel',
          'P': 'Pual',
          'h': 'Hiphil',
          'H': 'Hophal',
          't': 'Hithpael',
          'o': 'Poel',
          'O': 'Poal',
          'r': 'Hithpoel',
          'l': 'Pilpel',
          'L': 'Polal',
          'm': 'Hophal Passive',
        }[m[1]] || 'Unknown',
  
        aspect: {
          'q': 'Sequential Perfect',
          'w': 'Sequential Imperfect',
          'p': 'Perfect',
          'i': 'Imperfect',
          'h': 'Cohortative',
          'j': 'Jussive',
          'v': 'Imperative',
          'r': 'Participle Active',
          's': 'Participle Passive',
          'a': 'Infinitive Absolute',
          'c': 'Infinitive Construct',
        }[m[2]] || 'Unknown',
  
        person: { '1': '1st', '2': '2nd', '3': '3rd' }[m[3]] || 'Unknown',
        gender: { 'm': 'Masculine', 'f': 'Feminine', '-': 'Unspecified' }[m[4]] || 'Unknown',
        number: { 's': 'Singular', 'p': 'Plural', '-': 'Unspecified' }[m[5]] || 'Unknown',
      };
    }
  
    const parsedMorph =
      pos === 'R' || pos === 'N' ? parseNounMorph(morph) :
      pos === 'V' ? parseVerbMorph(morph) :
      { raw: morph };
  
    return {
      raw: code,
      language,
      formType,
      partOfSpeech,
      morphology: parsedMorph,
    };
  }

  function stripNiqqud(text) {
    return text.replace(/[\u0591-\u05C7]/g, '');
  }
  
  const finalLetterMap = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  function normalizeFinalForms(text) {
    return text.replace(/./g, c => finalLetterMap[c] || c);
  }

  function joinMorphHBWord(wordWithSlashes) {
    return wordWithSlashes.replace(/\//g, '');
  }
  
  function normalizeHebrewWord(text) {
    const normWord = normalizeFinalForms(stripNiqqud(text.trim()));

    return joinMorphHBWord(normWord)
  }

  function normalizeLemma(lemma) {
    if (!lemma) return null;
    const match = lemma.match(/\d+/);
    return match ? match[0] : null;
  }

  const normalizeHebrewWord2 = (word) => {
    // Remove cantillation marks (Unicode range: 0591–05AF)
    word = word.replace(/[\u0591-\u05AF]/g, '');
    // Optionally remove vowel points (Unicode range: 05B0–05C7)
    word = word.replace(/[\u05B0-\u05C7]/g, '');
    // Return normalized word
    return word;
  };

  const stripPrefixes = (word) => {
    const prefixes = ['וְ', 'בְ', 'לְ', 'כְ', 'מִ', 'שֶ', 'הַ'];
    for (const prefix of prefixes) {
      if (word.startsWith(prefix)) {
        return word.slice(prefix.length);
      }
    }
    return word;
  };

  const preprocessWord = (word) => {
    word = normalizeHebrewWord2(word);
    word = stripPrefixes(word);
    return word;
  };
  
  
  module.exports = {
    parseMorphHB,
    normalizeHebrewWord,
    normalizeLemma,
    preprocessWord
  };
  