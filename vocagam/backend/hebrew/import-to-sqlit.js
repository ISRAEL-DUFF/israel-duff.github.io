const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const utils = require('./util'); // Import the utils module

const db = new sqlite3.Database('../data/database/hebrew_morphology.db');
const data = JSON.parse(fs.readFileSync('parsed_ot.json', 'utf8'));

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS morphology`);
  db.run(`
    CREATE TABLE morphology (
      id INTEGER PRIMARY KEY,
      book TEXT,
      chapter INTEGER,
      verse INTEGER,
      word TEXT,
      normalized_word TEXT,
      strong_number TEXT,
      lemma TEXT,
      morph TEXT
    )
  `);

  const insert = db.prepare(`
    INSERT INTO morphology (book, chapter, verse, word, normalized_word, lemma, strong_number, morph)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of data) {
    insert.run(
      item.book,
      item.chapter,
      item.verse,
      item.word,
      utils.normalizeHebrewWord(item.word),
      item.lemma,
      utils.normalizeLemma(item.lemma),
      item.morph
    );
  }

  insert.finalize();

  // Add indexes for fast lookups
  db.run(`CREATE INDEX idx_word ON morphology(word)`);
  db.run(`CREATE INDEX idx_lemma ON morphology(lemma)`);
  db.run(`CREATE INDEX idx_strong_number ON morphology(strong_number)`);
  db.run(`CREATE INDEX idx_morph ON morphology(morph)`);

  console.log("✅ Database created and populated.");
});

db.close();
