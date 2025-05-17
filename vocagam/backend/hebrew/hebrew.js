const fs = require('fs');
const parseMorphHB = require('./parseMorphHB');

// Load lexicon JSON
const lexicon = JSON.parse(fs.readFileSync('lexicon.json', 'utf8'));

function stripNiqqud(text) {
  return text.replace(/[\u0591-\u05C7]/g, '');
}

const finalLetterMap = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
function normalizeFinalForms(text) {
  return text.replace(/./g, c => finalLetterMap[c] || c);
}

function normalizeHebrewWord(text) {
  return normalizeFinalForms(stripNiqqud(text.trim()));
}

function lookupHebrewWord(word) {
  const normalized = normalizeHebrewWord(word);
  const match = lexicon.find(entry => normalizeHebrewWord(entry.lemma) === normalized);

  if (!match) {
    console.log(`❌ No match found for "${word}"`);
    return;
  }

  const morphInfo = parseMorphHB(match.morphology || '');

  console.log(`📘 Lexical Entry for "${word}":`);
  console.log(`- Lemma: ${match.lemma}`);
  console.log(`- Morphology Code: ${match.morphology}`);
  console.log(`- Part of Speech: ${morphInfo.partOfSpeech}`);
  console.log(`- Morphological Details:`, morphInfo.morphology);
  console.log(`- Meaning: ${match.meaning}`);
}

// Run from command line
const input = process.argv[2];
if (!input) {
  console.log("Usage: node lookup.js <hebrew-word>");
  process.exit(1);
}
lookupHebrewWord(input);
