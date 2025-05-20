const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../data/database/greek_lexicon.db');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS lsj_lexicon`);
  db.run(`DROP TABLE IF EXISTS dodson_lexicon`);

  db.run(`
    CREATE TABLE lsj_lexicon (
      id INTEGER PRIMARY KEY,
      word TEXT,
      normalized_word TEXT,
      beta_code TEXT,
      xml_entry TEXT
    )
  `);

  db.run(`
    CREATE TABLE dodson_lexicon (
      id INTEGER PRIMARY KEY,
      greek_word TEXT,
      beta_code TEXT,
      strong_number TEXT,
      lemma TEXT,
      short_definition TEXT,
      long_definition TEXT
    )
  `);

  // Add indexes for fast lookups
  db.run(`CREATE INDEX idx_word ON lsj_lexicon(word)`);
  db.run(`CREATE INDEX idx_normalized_word ON lsj_lexicon(normalized_word)`);
  db.run(`CREATE INDEX idx_beta_code ON lsj_lexicon(beta_code)`);

  db.run(`CREATE INDEX idx_beta_code_dodson ON dodson_lexicon(beta_code)`);
  db.run(`CREATE INDEX idx_strong_number ON dodson_lexicon(strong_number)`);
  db.run(`CREATE INDEX idx_lemma_dodson ON dodson_lexicon(lemma)`);
  db.run(`CREATE INDEX idx_greek_word ON dodson_lexicon(greek_word)`);

  console.log("✅ Database created");
});

db.close();
