// Helper to try expanding a contracted form into possible uncontracted forms
export function expandContractedForms(form) {
    const possibilities = [form];
  
    // Some common contraction patterns in Attic and Koine
    const contractionRules = [
      { contracted: "εῖ", expands: "εει" },
      { contracted: "οῖ", expands: "οοι" },
      { contracted: "ᾷ", expands: "αει" },
      { contracted: "ῶ", expands: "οο" },
      { contracted: "ᾶ", expands: "αα" },
      { contracted: "ῷ", expands: "οει" },
      { contracted: "ῇ", expands: "εει" },
      { contracted: "ῴ", expands: "οιει" },
      { contracted: "οῦ", expands: "οου" },
      { contracted: "αῦ", expands: "αου" },
      { contracted: "εῦ", expands: "εου" }
    ];
  
    contractionRules.forEach(({ contracted, expands }) => {
      if (form.includes(contracted)) {
        possibilities.push(form.replace(contracted, expands));
      }
    });
  
    return possibilities;
}

function matchAgainstParticipleEndings(form, endingsObj, tense, voice, mood) {
    ["masculine", "feminine", "neuter"].forEach(gender => {
      ["singular", "plural"].forEach(number => {
        Object.entries(endingsObj[gender][number]).forEach(([caseName, ending]) => {
          if (form.endsWith(ending)) {
            matches.push({
              tense,
              voice,
              mood,
              gender,
              number,
              case: caseName,
              ending
            });
          }
        });
      });
    });
  }
  
  