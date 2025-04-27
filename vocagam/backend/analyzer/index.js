import { endings } from './endings/endings.js';
import { contractEndings } from './endings/contractEndings.js';
import { infinitiveEndings } from './endings/infinitiveEndings.js';
import { participleEndings } from './endings/participleEndings.js';
import { irregularForms } from './endings/irregularForms.js';
import { sortEndings } from './utils.js';

export function analyzeWord(word) {
  const matches = [];

  // Check for irregular forms first
  if (irregularForms[word]) {
    return irregularForms[word].map(parse => ({
      word,
      irregular: true,
      ...parse
    }));
  }

  const endingSources = [
    { endings: endings, label: "normal" },
    { endings: contractEndings, label: "contract" },
    { endings: infinitiveEndings, label: "infinitive" },
    { endings: participleEndings, label: "participle" }
  ];

  for (let { endings: endingsMap, label } of endingSources) {
    const endingList = sortEndings(endingsMap);

    for (let ending of endingList) {
      if (word.endsWith(ending)) {
        endingsMap[ending].forEach(parse => {
          matches.push({
            word,
            type: label,
            ending,
            ...parse
          });
        });
        break; // Stop after first match (most specific)
      }
    }
    if (matches.length > 0) break; // Stop once matched
  }

  if (matches.length === 0) {
    matches.push({ word, error: "No parsing found" });
  }

  return matches;
}
