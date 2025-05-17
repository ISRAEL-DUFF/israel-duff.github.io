const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const filePath = path.join(__dirname, 'wlc', '1Chr.xml'); // Adjust path if needed
const xml = fs.readFileSync(filePath, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  preserveOrder: false,
  trimValues: false
});

const data = parser.parse(xml);
const osis = data.osis;
const book = osis.osisText.div;

const bookName = book['book']?.['osisID'] || 'Unknown';
const verses = book['chapter']['verse'];

let output = [];

// Normalize to always iterate as array
function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

asArray(verses).forEach(verse => {
  const osisID = verse.osisID; // e.g., "1Chr.1.1"
  const [book, chapter, verseNum] = osisID.split('.');

  const words = asArray(verse.w);
  words.forEach(w => {
    output.push({
      book,
      chapter: parseInt(chapter),
      verse: parseInt(verseNum),
      word: w['#text'] || '',
      lemma: w['lemma'] || '',
      morph: w['morph'] || ''
    });
  });
});

fs.writeFileSync('parsed_1Chr.json', JSON.stringify(output, null, 2), 'utf8');
console.log(`✅ Parsed ${output.length} words from 1 Chronicles`);
