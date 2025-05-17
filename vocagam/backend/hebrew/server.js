const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors'); // Import the CORS middleware
const utils = require('./util'); // Import the utils module
const { parseMorphHB, makeAccentless } = require('./morphParser'); // Import the MorphParser module

const app = express();
// Enable CORS for all routes
app.use(cors());
 
const hebrewMorphDb = new sqlite3.Database('../data/database/hebrew_morphology.db');
const hebrewLexiconDb = new sqlite3.Database('../data/database/hebrew_lexicon.db');

app.use(express.static('public'));
app.use(express.json());

function fetchBDBLexiconEntry(strongsNumber) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM bdb_lexicon WHERE strong_number = ?`;
        hebrewLexiconDb.get(sql, [strongsNumber], (err, row) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (row) {
                    // const xmlEntry = row.xml_entry;
                    // const entry = utils.parseXML(xmlEntry);
                    resolve(row);
                } else {
                    resolve(null);
                }
            }
        });
    });

    // let query = `SELECT * FROM bdb_lexicon WHERE 1=1`;
    // const params = [];
  
    // if (strongsNumber) {
    //   query += ` AND strong_number = ?`;
    //   params.push(strongsNumber);
    // }
  
    // console.log('Query:', query);
    // console.log('Params:', params);
  
    // hebrewLexiconDb.all(query + ` LIMIT 100`, params, (err, rows) => {
    //   if (err) return res.status(500).json({ error: err.message });
    //   console.log('Rows:', rows);
    //   res.json(rows);
    // });
}

function fetchStrongsLexiconEntry(strongsNumber) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM strongs_lexicon WHERE strong_number = ?`;
        hebrewLexiconDb.get(sql, [strongsNumber], (err, row) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (row) {
                    resolve({
                        ...row,
                        entry: JSON.parse(row.entry)
                    });
                } else {
                    resolve(null);
                }
            }
        });
    });
}

async function fetchLexiconEntry(strongsNumber) {
    const bdbEntry = await fetchBDBLexiconEntry(strongsNumber);
    const strongsEntry = await fetchStrongsLexiconEntry(strongsNumber);
    return {
        bdbEntry,
        strongsEntry
    };
}

app.post('/search', (req, res) => {
  const { word } = req.body;

  if(!word) {
    return res.status(400).json({ error: 'Missing word' });
  }

  let query = `SELECT * FROM morphology WHERE 1=1`;
  const params = [];

  if (word) {
    // console.log(utils.normalizeHebrewWord(word), makeAccentless(word))
    query += ` AND (normalized_word = ? OR strong_number = ?)`;
    // params.push(utils.normalizeHebrewWord(word));
    params.push(utils.preprocessWord(word));

    const strongNum = word[0] === 'H' ? word.replace('H', '') : word;
    params.push(strongNum);
  }

  console.log('Query:', query);
  console.log('Params:', params);

  hebrewMorphDb.all(query + ` LIMIT 100`, params, async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // console.log('Rows:', rows);
    res.json({
        lexicalEntries: rows[0] ? await fetchLexiconEntry("H" + rows[0].strong_number) : undefined,
        refs: rows.map(row => ({
            book: row.book,
            chapter: row.chapter,
            verse: row.verse,
            word: row.word,
          morphology: parseMorphHB(row.morph),
          strongNumber: `H${row.strong_number}`,
        }))
    });
  });
});

app.get('/lexicon', (req, res) => {
    const { strongs_number: strongsNumber } = req.query;
    console.log('Received strongsNumber:', strongsNumber);
  
    let query = `SELECT * FROM bdb_lexicon WHERE 1=1`;
    const params = [];
  
    if (strongsNumber) {
      query += ` AND strong_number = ?`;
      params.push(strongsNumber);
    }
  
    console.log('Query:', query);
    console.log('Params:', params);
  
    hebrewLexiconDb.all(query + ` LIMIT 100`, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log('Rows:', rows);
      res.json(rows);
    });
});

app.get('/search-morph', (req, res) => {
    const morphCode = req.query.code;
    if (!morphCode) {
      return res.status(400).json({ error: 'Missing morph code' });
    }
  
    const sql = `
      SELECT * FROM morphology
      WHERE morph LIKE ?
      ORDER BY book, chapter, verse
      LIMIT 100;
    `;
  
    hebrewMorphDb.all(sql, [`%${morphCode}%`], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows.map(row => ({
            morph: row.morph,
            book: row.book,
            chapter: row.chapter,
            verse: row.verse,
            word: row.word,
          morphology: parseMorphHB(row.morph),
          strongNumber: `H${row.strong_number}`,
        })));
      }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Hebrew Lexicon app running at http://localhost:${PORT}`);
});


// הַשָּׁמַ֥יִם
