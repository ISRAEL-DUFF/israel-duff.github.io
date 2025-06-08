const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
const { parseDocument } = require('htmlparser2');

// Input CSV
const csvFile = 'vulgate.csv';

// SQLite DB setup
const db = new sqlite3.Database('vulgate.sqlite');
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS lemmatized_vulgate`);
  db.run(`
    CREATE TABLE lemmatized_vulgate (
      id INTEGER PRIMARY KEY,
      book TEXT,
      abbrev TEXT,
      chapter INTEGER,
      verse INTEGER,
      subverse INTEGER,
      word TEXT,
      lemma TEXT,
      lemma_index INTEGER
    )
  `);
});

// Morpheus Latin parser URL (Perseus Hopper)
const MORPH_URL = 'https://www.perseus.tufts.edu/hopper/morph?l=';

// Normalize punctuation and casing
function cleanWord(w) {
  return w.replace(/[.,:;!?()\[\]«»"“”‘’']/g, '').toLowerCase();
}

// Query Morpheus and parse HTML response
async function getLemma(word) {
  const res = await fetch(`${MORPH_URL}${encodeURIComponent(word)}&lang=la`);
  const html = await res.text();
  const doc = parseDocument(html);
  const results = [];

  // Extract lemma text from HTML
  const stack = [doc];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.type === 'tag' && node.name === 'a' && node.attribs?.href?.includes('lemma=')) {
      const text = node.children?.[0]?.data?.trim();
      if (text && !results.includes(text)) results.push(text);
    }
    if (node.children) stack.push(...node.children);
  }

  return results.length > 0 ? results[0] : null; // pick first lemma
}

// Process CSV and lemmatize
async function processCSV() {
  const rows = [];

  fs.createReadStream(csvFile)
    .pipe(csv({ separator: '\t' }))
    .on('data', row => rows.push(row))
    .on('end', async () => {
      let id = 1;
      for (const row of rows) {
        const {
          'Genesis': book,
          'Gn': abbrev,
          '1': chapter,
          '1_1': verse,
          '1_1_1': subverse,
          'In principio creavit Deus cælum et terram.': text
        } = row;

        const words = text.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const raw = words[i];
          const cleaned = cleanWord(raw);
          if (!cleaned) continue;

          try {
            const lemma = await getLemma(cleaned);
            db.run(
              `INSERT INTO lemmatized_vulgate (id, book, abbrev, chapter, verse, subverse, word, lemma, lemma_index)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [id++, book, abbrev, chapter, verse, subverse, raw, lemma || '', i]
            );
          } catch (err) {
            console.error(`Failed to lemmatize '${cleaned}': ${err}`);
          }
        }
      }

      console.log('✅ Finished processing Vulgate.');
      db.close();
    });
}

processCSV();
