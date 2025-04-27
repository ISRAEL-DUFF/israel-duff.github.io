export function sortEndings(endingsMap) {
    return Object.keys(endingsMap).sort((a, b) => b.length - a.length);
}



// utils.js
function getStem(lemma, tense) {
  // Example for future expansion: check for irregulars first
  const irregularRoots = {
    // e.g. "λαμβάνω": { aorist: "λαβ" }
  };
  
  if (irregularRoots[lemma] && irregularRoots[lemma][tense]) {
    return irregularRoots[lemma][tense];
  }

  // Default stem: chop -ω off lemma
  if (lemma.endsWith("ω")) {
    return lemma.slice(0, -1);
  }
  
  return lemma; // fallback
}

function detectContract(lemma) {
  if (lemma.endsWith("άω")) return "alpha";
  if (lemma.endsWith("έω")) return "epsilon";
  if (lemma.endsWith("όω")) return "omicron";
  return null;
}

function combineStemEnding(stem, ending, contractType) {
  if (!contractType) return stem + ending;
  
  // Simple contraction rules (expand later for precision)
  if (contractType === "alpha") {
    if (ending.startsWith("ω")) return stem.slice(0, -1) + "ῶ";
    if (ending.startsWith("εις")) return stem.slice(0, -1) + "ᾷς";
    if (ending.startsWith("ει")) return stem.slice(0, -1) + "ᾷ";
    // ... (expand more endings later)
  }
  if (contractType === "epsilon") {
    if (ending.startsWith("ω")) return stem.slice(0, -1) + "ῶ";
    if (ending.startsWith("εις")) return stem.slice(0, -1) + "εῖς";
    if (ending.startsWith("ει")) return stem.slice(0, -1) + "εῖ";
    // ...
  }
  if (contractType === "omicron") {
    if (ending.startsWith("ω")) return stem.slice(0, -1) + "ῶ";
    if (ending.startsWith("εις")) return stem.slice(0, -1) + "οῖς";
    if (ending.startsWith("ει")) return stem.slice(0, -1) + "οῖ";
    // ...
  }

  return stem + ending; // fallback
}

function findEnding(endings, person, number) {
  // endings is expected like: [["ω", "εις", "ει", "ομεν", "ετε", "ουσι(ν)"], etc]
  const personIndex = {
    "1st": 0,
    "2nd": 1,
    "3rd": 2
  }[person];
  
  const numberOffset = {
    "singular": 0,
    "plural": 3
  }[number];
  
  return endings[personIndex + numberOffset];
}

function fullParticipleDeclension(baseForms) {
  // Placeholder for participle declension generator
  // For now just a simple map: (expand fully later)
  return [
    { case: "nominativeSingularMasculine", ending: baseForms[0] },
    { case: "nominativeSingularFeminine", ending: baseForms[1] },
    { case: "nominativeSingularNeuter", ending: baseForms[2] },
    // ... (real full table later)
  ];
}


export function generateForm({
  lemma,
  tense,
  mood,
  voice,
  person,
  number,
  type = "finite"
}) {
  const stem = getStem(lemma, tense);
  const contractType = detectContract(lemma);

  if (type === "finite") {
    const endings = finiteVerbEndings[tense]?.[mood]?.[voice];
    if (!endings) throw new Error(`No endings for ${tense} ${mood} ${voice}`);
    const ending = findEnding(endings, person, number);
    const form = combineStemEnding(stem, ending, contractType);
    return form;
  }

  if (type === "infinitive") {
    const endings = infinitiveEndings[tense]?.[voice];
    if (!endings) throw new Error(`No infinitive endings for ${tense} ${voice}`);
    const ending = endings[0].ending; // basic version
    const form = combineStemEnding(stem, ending, contractType);
    return form;
  }

  if (type === "participle") {
    const endings = participleEndings[tense]?.[voice];
    if (!endings) throw new Error(`No participle endings for ${tense} ${voice}`);
    const baseForms = [endings[0].ending, endings[1].ending, endings[2].ending];
    const declension = fullParticipleDeclension(baseForms);
    const forms = {};
    for (const form of declension) {
      forms[form.case] = combineStemEnding(stem, form.ending, contractType);
    }
    return forms;
  }
}

// export const formGeneratorUtil = {
//   getStem,
//   combineStemEnding,
//   detectContract,
//   findEnding,
//   fullParticipleDeclension
// }

  