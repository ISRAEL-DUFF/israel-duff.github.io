function parseRobinsonMorph(code) {
    const indeclinables = {
        "ADV": {
            partOfSpeech: 'Adverb',
            value: "ADVerb or adverb and particle combined"
        },
        "CONJ": {
            partOfSpeech: 'Conjunction',
            value: "CONJunction or conjunctive particle"
        },
        "CONJ-N": {
            partOfSpeech: 'Conjunction',
            value: "CONJunction or Negative conjunctive particle"
        },
        "COND": {
            partOfSpeech: 'Particle',
            value: '"CONDitional particle or conjunction"'
        },
        "ADV-N": {
            partOfSpeech: 'Adverb',
            value: 'Adverb, Interrogative'
        },
        "ADV-I": {
            partOfSpeech: 'Adverb',
            value: 'Adverb, Negative'
        },
        "ADV-C": {
            partOfSpeech: 'Adverb',
            value: 'Adverb, Comparative'
        },
        "ADV-K": {
            partOfSpeech: 'Adverb',
            value: 'Adverb, Correlative'
        },
        "ADV-S": {
            partOfSpeech: 'Adverb',
            value: 'Adverb, Superlative'
        },
      "N-PRI": {
        partOfSpeech: 'Noun',
        value: 'Proper Noun, Indeclinable'
      },
      PDI: {
        partOfSpeech: 'Pronoun',
        value: 'Pronoun, Indeclinable'
      },
      AAI: {
        partOfSpeech: 'Adjective',
        value: 'Adjective, Indeclinable',
      },
      TDI: {
        partOfSpeech: 'Article',
        value: 'Article, Indeclinable'
      },
      PRT: {
        partOfSpeech: 'Particle',
        value: 'Particle, Indeclinable'
      },
      "PRT-N": {
        partOfSpeech: 'Particle',
        value: 'Particle, Negative, Indeclinable'
      },
      "PRT-I": {
        partOfSpeech: 'Particle',
        value: 'Particle, Interrogative'
      },
      ARAM: {
        partOfSpeech: 'Noun',
        value: 'Aramaic, Indeclinable'
      },
        HEB: {
            partOfSpeech: 'Noun',
            value: "HEBrew transliterated word (indeclinable)"
        },
        "N-PRI": {
            partOfSpeech: 'Noun',
            value: "Proper Noun (indeclinable)"
        },
        "A-NUI": {
            partOfSpeech: 'Adjective',
            value: "Indeclinable NUmeral (Adjective)"
        },
        " N-LI": {
            partOfSpeech: 'Noun',
            value: "Indeclinable Letter (Noun)"
        },
        "N-OI" : {
            partOfSpeech: 'Noun',
            value: "Indeclinable Noun of Other type"
        }
    };
  
    const simplePartsOfSpeech = {
      CONJ: 'Conjunction',
      ADV: 'Adverb',
      INJ: 'Interjection',
      PRT: 'Particle',
      PREP: 'Preposition'
    };
  
    if (simplePartsOfSpeech[code]) {
      return { partOfSpeech: simplePartsOfSpeech[code] };
    }
  
    // if (code.startsWith('N-PRI')) {
    //   return {
    //     partOfSpeech: 'Noun',
    //     type: indeclinables['PRI']
    //   };
    // }
    if (indeclinables[code]) {
        return {
          partOfSpeech: indeclinables[code]?.partOfSpeech ?? "Unknown",
          type: indeclinables[code]?.value ?? "Unknown"
        };
      }
  
    const parts = code.split('-');
    const pos = parts[0] || '';
    const sub1 = parts[1] || '';
    const sub2 = parts[2] || '';
  
    const posMap = {
      N: 'Noun',
      A: 'Adjective',
      V: 'Verb',
      P: 'Pronoun',
      R: 'Preposition',
      D: 'Adverb',
      C: 'Conjunction',
      I: 'Interjection',
      X: 'Particle',
      T: 'Article',
      M: 'Numeral'
    };

    // DECLINED FORMS: All follow the order: prefix-case-number-gender-(suffix)
    const declenableFormPrefixes = {
        N: "Noun",
        A: "Adjective",
        R: "Relative pronoun",
        C: "reCiprocal pronoun",
        D: "Demonstrative pronoun",
        T: "definite article",
        K: "correlative pronoun",
        I: "Interrogative pronoun",
        X: "indefinite pronoun",
        Q: "correlative or interrogative pronoun",
        F: "reFlexive pronoun",
        S: "poSsessive pronoun",
        P: "Personal pronoun"
    }
    const indeclinableFormSuffixes = {
        S: "Superlative (used only with adjectives and some adverbs)",
        C: "Comparative (used only with adjectives and some adverbs)",
        ABB: "ABBreviated form (used only with various numerals)",
        I: "Interrogative",
        N: "Negative (used only with particles as PRT-N)",
        C: "Contracted form, or two words merged by crasis",
        ATT: "ATTic Greek form",
        P: "Particle attached (with relative pronoun)"
    }
  
    const tenseMap = {
      P: 'Present',
      I: 'Imperfect',
      F: 'Future',
      '2F': 'Second Future',
      A: 'Aorist',
      '2A': 'Second Aorist',
      R: 'Perfect',
      '2R': 'Second Perfect',
      L: 'Pluperfect',
      '2L': 'Second Pluperfect'
    };
  
    const voiceMap = {
      A: 'Active',
      M: 'Middle',
      P: 'Passive',
      E: 'Middle or Passive',
      D: 'Middle (Deponent)',
      O: 'Passive (Deponent)',
      N: 'Middle or Passive (Deponent)',
      Q: 'Impersonal Active',
      X: 'no voice stated'
    };
  
    const moodMap = {
      I: 'Indicative',
      S: 'Subjunctive',
      O: 'Optative',
      M: 'Imperative',
      N: 'Infinitive',
      P: 'Participle',
      R: 'Participle (imperative sense)',
    };
  
    const caseMap = {
      N: 'Nominative',
      G: 'Genitive',
      D: 'Dative',
      A: 'Accusative',
      V: 'Vocative'
    };
  
    const numberMap = {
      S: 'Singular',
      P: 'Plural'
    };
  
    const genderMap = {
      M: 'Masculine',
      F: 'Feminine',
      N: 'Neuter'
    };
  
    const personMap = {
      1: '1st Person',
      2: '2nd Person',
      3: '3rd Person'
    };
  
    const morph = {
      partOfSpeech: posMap[pos] || 'Unknown'
    };
  
    if (pos === 'V') {
      const tense = (sub1.length >= 2 && tenseMap[sub1.slice(0, 2)]) ? sub1.slice(0, 2) : sub1[0];
      const voice = sub1[tense.length];
      const mood = sub1[tense.length + 1];

    //   console.log({
    //     tense, voice, mood
    //   })
  
      morph.tense = tenseMap[tense] || 'Unknown';
      morph.voice = voiceMap[voice] || 'Unknown';
      morph.mood = moodMap[mood] || 'Unknown';
  
      if (sub2) {
        // console.log(sub2);
        if(sub2.length === 3) { // participle
            morph.number = numberMap[sub2[1]] || 'Unknown';
            morph.gender = genderMap[sub2[2]] || 'Unknown';
            morph.case = caseMap[sub2[0]] || 'Unknown';
        } else { // normal verb
            morph.person = personMap[sub2[0]] || 'Unknown';
            morph.number = numberMap[sub2[1]] || 'Unknown';
        }
        
      }
    } else if (pos === 'N' || pos === 'A' || pos === 'P' || pos === 'T' || pos === 'F' || pos === 'S') {
        const prefix = declenableFormPrefixes[pos]
        let caseCode = '';
        let numberCode = '';
        let genderCode = '';
        let person = '';

        if(isNaN(sub1[0])) {
            caseCode = sub1[0];
            const [caseC, numCode, gender] = sub1.split('');
            caseCode = caseC;
            numberCode = numCode;
            genderCode = gender;
        } else {
            if(sub1[0] === '1') {
                person = '1st person';

                const [_, caseC, numCode] = sub1.split('');
                caseCode = caseC;
                numberCode = numCode;
            } else if(sub1[0] === '2') {
                person = '2nd person';
                const [_, caseC, numCode] = sub1.split('');
                caseCode = caseC;
                numberCode = numCode;
            } else {
                person = '3rd person';

                const [_, caseC, numCode, genCode] = sub1.split('');
                caseCode = caseC;
                numberCode = numCode;
                genderCode = genCode;
            }

            
        }

        const suffix = indeclinableFormSuffixes[sub2]

        morph.case = caseMap[caseCode] || 'Unknown';
        morph.number = numberMap[numberCode] || 'Unknown';
        morph.gender = genderMap[genderCode] || 'Unknown';
        morph.type = (indeclinables[prefix] || '') + ' ' + (indeclinableFormSuffixes[suffix] || '').trim();

        // console.log({
        //     prefix,
        //     sub1,
        //     sub2,
        //     caseCode,
        //     numberCode,
        //     genderCode,
        //     suffix,
        // })

    //   if (indeclinables[sub1]) {
    //     morph.type = indeclinables[sub1];
    //   } else {
    //     morph.case = caseMap[sub1[0]] || 'Unknown';
    //     morph.number = numberMap[sub1[1]] || 'Unknown';
    //     morph.gender = genderMap[sub1[2]] || 'Unknown';
    //   }
    }
  
    return morph;
}
  
  

// Example usage:
const morphCode1 = "N-PRI";
const morphCode2 = "V-AAI-3S";
const morphCode3 = "V-RPP-NSM"; // V-APP-NSM
const morphCode4 = "V-PNI-3S"; 
const morphCode5 = "P-2DP";

// console.log(parseRobinsonMorph(morphCode1));
// console.log(parseRobinsonMorph(morphCode2));
// console.log(parseRobinsonMorph(morphCode3));
// console.log(parseRobinsonMorph(morphCode4));
// console.log(parseRobinsonMorph(morphCode5));


module.exports = {
    parseMorphCode: parseRobinsonMorph,
};