
const endings = {
    "ω": [
      { tense: "present", voice: "active", mood: "indicative", person: "1st", number: "singular" },
      { tense: "subjunctive", voice: "active", mood: "subjunctive", person: "1st", number: "singular" }
    ],
    "εις": [
      { tense: "present", voice: "active", mood: "indicative", person: "2nd", number: "singular" }
    ],
    "ει": [
      { tense: "present", voice: "active", mood: "indicative", person: "3rd", number: "singular" }
    ],
    "οῖ": [
      { tense: "present", voice: "active", mood: "indicative", person: "3rd", number: "singular" },
      { tense: "present", voice: "active", mood: "subjunctive", person: "3rd", number: "singular" },
      { tense: "present", voice: "middle", mood: "indicative", person: "2nd", number: "singular" },
      { tense: "present", voice: "passive", mood: "indicative", person: "2nd", number: "singular" },
      { tense: "present", voice: "middle", mood: "subjunctive", person: "2nd", number: "singular" },
      { tense: "present", voice: "passive", mood: "subjunctive", person: "2nd", number: "singular" }
    ],
    // More endings...
};


export function analyzeWord(word) {
  // Check endings from longest to shortest
  const matches = [];

  const endingList = Object.keys(endings).sort((a, b) => b.length - a.length);

  for (let ending of endingList) {
    if (word.endsWith(ending)) {
      const possibilities = endings[ending];
      possibilities.forEach(parse => {
        matches.push({
          word,
          ending,
          ...parse
        });
      });
    }
  }

  return matches;
}

  