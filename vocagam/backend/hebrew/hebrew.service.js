const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const utils = require('./util'); // Import the utils module
const { parseMorphHB, makeAccentless } = require('./morphParser'); // Import the MorphParser module
 
const hebrewMorphDb = new sqlite3.Database('../data/database/hebrew_morphology.db');
const hebrewLexiconDb = new sqlite3.Database('../data/database/hebrew_lexicon.db');

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

async function searchMorphologyByCode(morphCode) {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT * FROM morphology
        WHERE morph LIKE ?
        ORDER BY book, chapter, verse
        LIMIT 100;
        `;
        hebrewMorphDb.all(sql, [`%${morphCode}%`], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => ({
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
    })
}

async function fetchLexiconEntriesAndMorphology(word) {
    let query = `SELECT * FROM morphology WHERE 1=1`;
    return new Promise((resolve, reject) => {
        const params = [];

        if(!word) {
            return reject(new Error('Hebrew word missing'))
        }

        // console.log(utils.normalizeHebrewWord(word), makeAccentless(word))
        query += ` AND (normalized_word = ? OR strong_number = ?)`;
        // params.push(utils.normalizeHebrewWord(word));
        params.push(utils.preprocessWord(word));

        const strongNum = word[0] === 'H' ? word.replace('H', '') : word;
        params.push(strongNum);

        console.log('Query:', query);
        console.log('Params:', params);
        // query + ` LIMIT 100`
        hebrewMorphDb.all(query, params, async (err, rows) => {
            if (err) return reject(err);
            // console.log('Rows:', rows);
            let bookSummary = {}

            for(const row of rows) {
                if(!bookSummary[row.book]) {
                    bookSummary[row.book] = {
                        book_name: row.book,
                        count: 0,
                        chapters: {}
                    }
                }
                bookSummary[row.book].count += 1;
                
                if(!bookSummary[row.book].chapters[`chapter_${row.chapter}`]) {
                    bookSummary[row.book].chapters[`chapter_${row.chapter}`] = {
                        count: 0,
                        occurrence: []
                    }
                }
                bookSummary[row.book].chapters[`chapter_${row.chapter}`].count += 1;
                bookSummary[row.book].chapters[`chapter_${row.chapter}`].occurrence.push({
                    book: row.book,
                    chapter: row.chapter,
                    verse: row.verse,
                    word: row.word,
                    morphology: parseMorphHB(row.morph),
                    strongNumber: `H${row.strong_number}`,
                })
            }

            resolve({
                lexicalEntries: rows[0] ? await fetchLexiconEntry("H" + rows[0].strong_number) : undefined,
                // refs: rows.map(row => ({
                //     book: row.book,
                //     chapter: row.chapter,
                //     verse: row.verse,
                //     word: row.word,
                //     morphology: parseMorphHB(row.morph),
                //     strongNumber: `H${row.strong_number}`,
                // })),
                structured: bookSummary,
                totalOccurrences: rows.length
            });
        });
    })
}

module.exports = {
    fetchLexiconEntriesAndMorphology,
    fetchBDBLexiconEntry,
    fetchStrongsLexiconEntry,
    fetchLexiconEntry,
    searchMorphologyByCode
}