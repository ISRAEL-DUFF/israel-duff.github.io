// import { presentActiveEndings } from "../endings/presentActiveEndings.js";
// import { presentMiddlePassiveEndings } from "../endings/presentMiddlePassiveEndings.js";
// import { imperfectActiveEndings } from "../endings/imperfectActiveEndings.js";
// import { imperfectMiddlePassiveEndings } from "../endings/imperfectMiddlePassiveEndings.js";
// import { futureActiveEndings } from "../endings/futureActiveEndings.js";
import { finiteVerbEndings, infinitiveEndings, participleEndings } from './endings/index.js'


/**
 * Match a Greek word form to possible morphological analyses.
 * @param {string} form - The Greek word form (e.g., λύομεν, ἔλυον, λύσω)
 * @returns {Array} Array of matching morphological possibilities
 */
// export function matchGreekForm(form) {
//   const results = [];

//   // Helper to match against endings
//   function matchAgainstEndings(form, endingsData, tense, voice, mood) {
//     Object.entries(endingsData).forEach(([number, endings]) => {
//       Object.entries(endings).forEach(([ending, info]) => {
//         if (form.endsWith(ending)) {
//           results.push({
//             tense,
//             voice,
//             mood,
//             number,
//             person: info.person,
//             ending,
//           });
//         }
//       });
//     });
//   }

//   // Present Active Indicative
//   matchAgainstEndings(form, presentActiveEndings.indicative, "present", "active", "indicative");

//   // Present Middle/Passive Indicative
//   matchAgainstEndings(form, presentMiddlePassiveEndings.indicative, "present", "middle/passive", "indicative");

//   // Imperfect Active Indicative
//   matchAgainstEndings(form, imperfectActiveEndings.indicative, "imperfect", "active", "indicative");

//   // Imperfect Middle/Passive Indicative
//   matchAgainstEndings(form, imperfectMiddlePassiveEndings.indicative, "imperfect", "middle/passive", "indicative");

//   // Future Active Indicative
//   matchAgainstEndings(form, futureActiveEndings.indicative, "future", "active", "indicative");

//   return results;
// }

// export function matchGreekForm(form) {
//     const results = [];
    
//     const formsToTry = expandContractedForms(form);
  
//     function matchAgainstEndings(tryForm, endingsData, tense, voice, mood) {
//       Object.entries(endingsData).forEach(([number, endings]) => {
//         Object.entries(endings).forEach(([ending, info]) => {
//           if (tryForm.endsWith(ending)) {
//             results.push({
//               tense,
//               voice,
//               mood,
//               number,
//               person: info.person,
//               ending,
//             });
//           }
//         });
//       });
//     }
  
//     for (const tryForm of formsToTry) {
//       // Present Active Indicative
//       matchAgainstEndings(tryForm, presentActiveEndings.indicative, "present", "active", "indicative");
  
//       // Present Middle/Passive Indicative
//       matchAgainstEndings(tryForm, presentMiddlePassiveEndings.indicative, "present", "middle/passive", "indicative");
  
//       // Imperfect Active Indicative
//       matchAgainstEndings(tryForm, imperfectActiveEndings.indicative, "imperfect", "active", "indicative");
  
//       // Imperfect Middle/Passive Indicative
//       matchAgainstEndings(tryForm, imperfectMiddlePassiveEndings.indicative, "imperfect", "middle/passive", "indicative");
  
//       // Future Active Indicative
//       matchAgainstEndings(tryForm, futureActiveEndings.indicative, "future", "active", "indicative");
//     }
  
//     return results;
//   }


// import { futureMiddleEndings } from './futureMiddleEndings.js';
// import { aoristActiveEndings } from './aoristActiveEndings.js';
// import { infinitiveEndings } from './infinitiveEndings.js';
// import { participleEndings } from './participleEndings.js';

// // inside matchGreekForm()

//   // Future Middle
//   matchAgainstEndings(tryForm, futureMiddleEndings.indicative, "future", "middle", "indicative");

//   // Aorist Active
//   matchAgainstEndings(tryForm, aoristActiveEndings.indicative, "aorist", "active", "indicative");

//   // Infinitives
//   infinitiveMatching(tryForm);

//   // Participles
//   participleMatching(tryForm);


//   // Future Passive
//   matchAgainstEndings(tryForm, futurePassiveEndings.indicative, "future", "passive", "indicative");

//   // Aorist Middle
//   matchAgainstEndings(tryForm, aoristMiddleEndings.indicative, "aorist", "middle", "indicative");

//   // Perfect Active
//   matchAgainstEndings(tryForm, perfectActiveEndings.indicative, "perfect", "active", "indicative");

//   // Perfect Middle/Passive
//   matchAgainstEndings(tryForm, perfectMiddlePassiveEndings.indicative, "perfect", "middlepassive", "indicative");


//   matchAgainstParticipleEndings(tryForm, participlesPresentActive, "present", "active", "participle");


  

// // ...

// // Helper functions
// function infinitiveMatching(form) {
//   Object.entries(infinitiveEndings).forEach(([tense, voices]) => {
//     Object.entries(voices).forEach(([voice, endings]) => {
//       endings.forEach(ending => {
//         if (form.endsWith(ending)) {
//           results.push({
//             tense,
//             voice,
//             mood: "infinitive",
//             ending
//           });
//         }
//       });
//     });
//   });
// }

// function participleMatching(form) {
//   Object.entries(participleEndings).forEach(([tense, voices]) => {
//     Object.entries(voices).forEach(([voice, genders]) => {
//       Object.entries(genders).forEach(([gender, numbers]) => {
//         Object.entries(numbers).forEach(([number, cases]) => {
//           Object.entries(cases).forEach(([caseName, endings]) => {
//             endings.forEach(ending => {
//               if (form.endsWith(ending)) {
//                 results.push({
//                   tense,
//                   voice,
//                   mood: "participle",
//                   gender,
//                   number,
//                   case: caseName,
//                   ending
//                 });
//               }
//             });
//           });
//         });
//       });
//     });
//   });
// }

  





// We assume you already have:
// - finiteVerbEndings
// - participleEndings
// - infinitiveEndings





/**
 * Parses a Greek participle and returns possible matches.
 * @param {string} word - The Greek word to parse.
 * @param {object} options - Additional options like known lemma stem.
 */
function parseParticiple(word, options = {}) {
    const matches = [];
  
    for (const tense of Object.keys(participleEndings)) {
      for (const voice of Object.keys(participleEndings[tense])) {
        const forms = participleEndings[tense][voice];
        for (const gender of Object.keys(forms)) {
          for (const number of Object.keys(forms[gender])) {
            for (const morphCase of Object.keys(forms[gender][number])) {
              const ending = forms[gender][number][morphCase];
  
              if (word.endsWith(ending)) {
                matches.push({
                  tense,
                  voice,
                  gender,
                  number,
                  case: morphCase,
                  ending,
                });
              }
            }
          }
        }
      }
    }
  
    return matches;
}


function parseFiniteVerb(word, options = {}) {
    const matches = [];
  
    for (const tense in finiteVerbEndings) {
      for (const mood in finiteVerbEndings[tense]) {
        for (const voice in finiteVerbEndings[tense][mood]) {
          const endingsList = finiteVerbEndings[tense][mood][voice];
  
          for (const form of endingsList) {
            if (word.endsWith(form.ending)) {
              matches.push({
                tense,
                mood,
                voice,
                person: form.person,
                number: form.number,
                ending: form.ending,
              });
            }
          }
        }
      }
    }
  
    return matches;
}

  function parseInfinitive(word, options = {}) {
    const matches = [];
  
    for (const tense in infinitiveEndings) {
      for (const voice in infinitiveEndings[tense]) {
        const endingsList = infinitiveEndings[tense][voice];
  
        for (const form of endingsList) {
          if (word.endsWith(form.ending)) {
            matches.push({
              tense,
              voice,
              mood: 'infinitive',
              ending: form.ending,
            });
          }
        }
      }
    }
  
    return matches;
}
  

export function parseMorphology(word, options = {}) {
    let results = [];
  
    // 1. Try participles first
    const participleMatches = parseParticiple(word, options);
    if (participleMatches.length > 0) {
      participleMatches.forEach(match => {
        results.push({
          type: 'participle',
          ...match
        });
      });
    }
  
    // 2. Try finite verbs
    const verbMatches = parseFiniteVerb(word, options);
    if (verbMatches.length > 0) {
      verbMatches.forEach(match => {
        results.push({
          type: 'finite_verb',
          ...match
        });
      });
    }
  
    // 3. Try infinitives
    const infinitiveMatches = parseInfinitive(word, options);
    if (infinitiveMatches.length > 0) {
      infinitiveMatches.forEach(match => {
        results.push({
          type: 'infinitive',
          ...match
        });
      });
    }
  
    return results;
}
  