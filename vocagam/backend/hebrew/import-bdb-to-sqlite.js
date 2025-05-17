const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../data/database/hebrew_lexicon.db');
const data = JSON.parse(fs.readFileSync('../data/DictBDB.json', 'utf8'));

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS bdb_lexicon`);
  db.run(`
    CREATE TABLE bdb_lexicon (
      id INTEGER PRIMARY KEY,
      strong_number TEXT,
      xml_entry TEXT
    )
  `);

  const insert = db.prepare(`
    INSERT INTO bdb_lexicon (strong_number, xml_entry)
    VALUES (?, ?)
  `);

  for (const item of data) {
    if(item.top.charAt(0) !== 'H') {
        console.log("Ignore:", {
            item
        });
        continue;
    }

    insert.run(
      item.top,
      item.def
    );
  }

  insert.finalize();

  // Add indexes for fast lookups
  db.run(`CREATE INDEX idx_bdb_strong_number ON bdb_lexicon(strong_number)`);

  console.log("✅ Database created and populated.");
});

db.close();
