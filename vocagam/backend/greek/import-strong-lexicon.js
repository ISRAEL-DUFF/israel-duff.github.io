const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../data/database/greek_lexicon.db');
// const data = JSON.parse(fs.readFileSync('../data/DictBDB.json', 'utf8'));
const data = require('./strong_greek_lexicon')

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS strongs_lexicon`);
  db.run(`
    CREATE TABLE strongs_lexicon (
      id INTEGER PRIMARY KEY,
      strong_number TEXT,
      lemma TEXT,
      entry JSONB
    )
  `);

  const insert = db.prepare(`
    INSERT INTO strongs_lexicon (strong_number, lemma, entry)
    VALUES (?, ?, ?)
  `);

  for (const strongNumber in data) {
    insert.run(
      strongNumber,
      data[strongNumber].lemma,
      JSON.stringify(data[strongNumber])
    );
  }

  insert.finalize();

  // Add indexes for fast lookups
  db.run(`CREATE INDEX idx_strongs_strong_number ON strongs_lexicon(strong_number)`);
  db.run(`CREATE INDEX idx_strongs_lemma ON strongs_lexicon(lemma)`);

  console.log("✅ Database created and populated.");
});

db.close();
