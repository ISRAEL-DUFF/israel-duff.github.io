const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { DOMParser } = require("xmldom");
const { betaCodeToGreek } = require('beta-code-js');
// const { parseStringPromise } = require("xml2js");
const xpath = require("xpath");


console.log(__dirname)
const dbLexiconPath = path.join(__dirname, '../data/database', 'greek_lexicon.db')
const dbThayersLexiconPath = path.join(__dirname, '../data/database', 'thayer.db')
const dbGNTMorphoPath = path.join(__dirname, '../data/database', 'gnt_morph.db')
const dbLXXMorphoPath = path.join(__dirname, '../data/database', 'lxx_morph.db')


// '../data/database/greek_lexicon.db'
const greekLexiconDb = new sqlite3.Database(dbLexiconPath);
const thayerLexiconDb = new sqlite3.Database(dbThayersLexiconPath);
const gntMorphDb = new sqlite3.Database(dbGNTMorphoPath);
const lxxMorphDb = new sqlite3.Database(dbLXXMorphoPath);


function normalizeGreek(lemma) {
    const unicode = betaCodeToGreek(lemma);
    return unicode
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
}

function prepareStrongNumber(strongNum) {
    // Remove any leading zeros
    // strongNum = strongNum.replace(/^0+/, '');
    
    // Add 'G' prefix if not already present
    if (!strongNum.startsWith('G')) {
        return 'G' + strongNum.replace(/^0+/, '');
    }
    
    return 'G' + (strongNum.substr(1).replace(/^0+/, ''));
}

function prepareStrongNumber2(strongNum) {
    // Remove any leading zeros
    
    // Add 'G' prefix if not already present
    if (strongNum.startsWith('G')) {
        return strongNum.toString().substr(1).replace(/^0+/, '');
    }
    
    return strongNum.replace(/^0+/, '');
}

async function extractLSJEntrySenses(xmlEntry) {
  const doc = new DOMParser().parseFromString(xmlEntry, "text/xml");
  const senseNodes = xpath.select("//sense", doc);
  const results = [];

  const processCitation = (citation) => {
    const quote = (xpath.select(".//quote", citation))[0]?.textContent.trim();
    const bibl = (xpath.select(".//bibl", citation))[0];
    let biblRef = null;
    if (bibl) {
        biblRef = {
        author: (xpath.select(".//author", bibl))[0]?.textContent.trim() || null,
        title: (xpath.select(".//title", bibl))[0]?.textContent.trim() || null,
        passage: bibl.textContent.trim()
        };
    }
    return { quote, bibl: biblRef };
  }
  
  const processBibl = (bibliology) => {
    const title = (xpath.select(".//title", bibliology))[0]?.textContent.trim();
    const author = (xpath.select(".//author", bibliology))[0];
      const txt = xpath.select(".//text()", bibliology).join('')
    
    return { text: txt ?? '', title: title ?? '', author: author ?? '' };
  }
  
  senseNodes.forEach(sense => {
    const children = xpath.select('./node()', sense);
    let htmlText = '<div>';
    let glosses = [];
    let citations = [];
    children.forEach((node, i) => {
        const ignoredTexts = []

        if(node.nodeName === 'cit') {
          const citation = processCitation(node);
          htmlText += `<span class="inline-citation">${citation.quote}</span>`;
          citations.push(citation)
        } else if(node.nodeName === '#text') {
          const text = node.textContent.trim();
          htmlText += `<span class="gloss-context">${ignoredTexts.includes(text) ? '' : text}</span>`;
        } else if(node.nodeName === 'i') {
          const text = node.textContent.trim();
          glosses.push(text)
          htmlText += `<span class="gloss-sense">${text}</span>`;
        } else if(node.nodeName === 'foreign') {
          const text = node.textContent.trim();
          htmlText += `<span class="foreign-text">${text}</span>`;
        } else if(node.nodeName === 'bibl') {
          const bibl = processBibl(node);
          htmlText += `
          <span class="inline-bibl">
            <span class="author">${bibl.author}</span>, 
            <span class="title">${bibl.title}</span> 
            <span class="reference">${bibl.text}</span>
          </span>`
        } else {
            const text = node.textContent.trim();
            htmlText += `<span class="other-text">${text}</span>`;
        }
    });

    htmlText += '</div>';

    const senseObj = {
      id: sense.getAttribute("id"),
      level: sense.getAttribute("level"),
      htmlText,
      glosses,
      quotes: citations
    }

    results.push(senseObj)
  });

  // console.log(results)
  return results;
}

function fetchStrongsLexiconEntry({strongsNumber, greekWordLemma}) {
    let query = '';

    if(!strongsNumber && !greekWordLemma) {
        throw new Error("strongs number or word lemma is expected")
    }

    if(strongsNumber) {
        query += `strong_number = ?`;
    }
    if(greekWordLemma) {
        if(query.length > 0) {
            query += ` OR `;
        }
        query += `lemma = ?`;
    }
    if(query.length > 0) {
        query = `WHERE ` + query;
    }

    const sql = `SELECT * FROM strongs_lexicon ${query}`;
    const params = [];
    if(strongsNumber) {
        params.push(prepareStrongNumber(strongsNumber));
    }
    if(greekWordLemma) {
        params.push(greekWordLemma);
    }

    console.log('SQL:', sql, params);

    return new Promise((resolve, reject) => {
        // const sql = `SELECT * FROM strongs_lexicon WHERE strong_number = ?`;
        greekLexiconDb.get(sql, params, (err, row) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (row) {
                    // console.log(row)
                    resolve(JSON.parse(row.entry));
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function fetchDodsonLexiconEntry({ strongsNumber, greekWordLemma }) {
    let query = '';

    if(strongsNumber) {
        query += `strong_number = ?`;
    }
    if(greekWordLemma) {
        if(query.length > 0) {
            query += ` OR `;
        }
        query += `lemma = ?`;
    }
    if(query.length > 0) {
        query = `WHERE ` + query;
    }
    const sql = `SELECT * FROM dodson_lexicon ${query}`;
    const params = [];
    if(strongsNumber) {
        params.push(prepareStrongNumber(strongsNumber));
    }
    if(greekWordLemma) {
        params.push(greekWordLemma);
    }

    console.log('SQL:', sql, params);

    return new Promise((resolve, reject) => {
        // const sql = `SELECT * FROM dodson_lexicon WHERE strong_number = ?`;
        greekLexiconDb.get(sql, params, (err, row) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (row) {
                    // resolve({
                    //     ...row,
                    //     entry: JSON.parse(row.entry)
                    // });
                    resolve(row);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function fetchLSJLexiconEntries(greekWord) {
    return new Promise((resolve, reject) => {
        const normalizedWord = normalizeGreek(greekWord)
        let columns = `word, beta_code, normalized_word, xml_entry`
        const queryParams = [normalizedWord, greekWord]
        let whereCondition = `normalized_word = ? OR word = ?`
        
        const sql = `
        SELECT ${columns} FROM lsj_lexicon
        WHERE ${whereCondition}
        `;
        greekLexiconDb.all(sql, queryParams, async (err, rows) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (rows && rows.length > 0) {
                    for(const row of rows) {
                        row.senses = await extractLSJEntrySenses(row.xml_entry)
                        row.xml_entry = undefined;
                    }
                    resolve(rows);
                } else {
                    resolve([]);
                }
            }
        });
    });
}

function fetchThayerLexiconEntry({ strongsNumber }) {
    let query = '';

    console.log("thayer Input:", {
        strongsNumber
    })

    if(!strongsNumber) {
        // throw new Error("strongs number is expected")
        return null;
    }

    
    query += `Topic = ?`;

    
    if(query.length > 0) {
        query = `WHERE ` + query;
    }

    const sql = `SELECT * FROM Lexicon ${query}`;
    const params = [prepareStrongNumber(strongsNumber)];

    console.log('SQL:', sql, params);

    return new Promise((resolve, reject) => {
        // const sql = `SELECT * FROM strongs_lexicon WHERE strong_number = ?`;
        thayerLexiconDb.get(sql, params, (err, row) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (row) {
                    // console.log(row)
                    // TODO: format thayer output
                    let htmlText = row.Definition.replaceAll('<ref0 class="word"', '<span class="thayer-word-reference"')
                    htmlText = htmlText.replaceAll('</ref0>', '</span>');

                    htmlText = htmlText.replaceAll('<ref', '<span class="thayer-scripture-reference"')
                    htmlText = htmlText.replaceAll('</ref>', '</span>');

                    htmlText = htmlText.replaceAll('<i', '<i class="thayer-gloss-sense"')
                    htmlText = htmlText.replaceAll('<p', '<p class="sense-section"');

                    htmlText = htmlText.replaceAll('Latin', "Latin: ")

                    // console.log(htmlText)

                    resolve({
                        strongNumber: row.Topic,
                        htmlText
                    });
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function findOccurrencesInGNT({
    lemma,
    strongsNumber
}) {
    const params = [];
    let sql = '';

    if(!lemma && !strongsNumber) {
        return Promise.reject('No lemma or strongs number provided');
    }

    if(lemma) {
        params.push(lemma);
        strongsNumber = null;
        sql = `SELECT book_name, Count(*) as count FROM new_testament_morphology WHERE lemma = ? GROUP BY book_name`;
    }

    if(strongsNumber) {
        strongsNumber = prepareStrongNumber(strongsNumber);
        params.push(strongsNumber);
        sql = `SELECT book_name, COUNT(*) as count FROM new_testament_morphology WHERE strong_number = ? GROUP BY book_name`;
    }

    console.log('SQL:', sql);
    return new Promise((resolve, reject) => {
        gntMorphDb.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (rows) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function findOccurrencesInGNTBook({
    lemma,
    strongsNumber,
    bookName
}) {
    const params = [bookName];
    let sql = '';

    if(!lemma && !strongsNumber) {
        return Promise.reject('No lemma or strongs number provided');
    }

    if(lemma) {
        params.push(lemma);
        strongsNumber = null;
        // sql = `SELECT * FROM new_testament_morphology WHERE book_name = ? AND lemma = ? GROUP BY chapter`;
        sql = `SELECT * FROM new_testament_morphology WHERE book_name = ? AND lemma = ?`;

    }

    if(strongsNumber) {
        strongsNumber = prepareStrongNumber(strongsNumber);
        params.push(strongsNumber);
        // sql = `SELECT * FROM new_testament_morphology WHERE book_name = ? AND strong_number = ? GROUP BY chapter`;
        sql = `SELECT * FROM new_testament_morphology WHERE book_name = ? AND strong_number = ?`;

    }

    console.log('SQL:', sql);
    return new Promise((resolve, reject) => {
        gntMorphDb.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (rows) {
                    let respObj = {};
                    let totalOccurrences = rows.length;
                    let word = rows[0].lemma;
                    for(const row of rows) {
                        const chapter = row.chapter;
                        const chaptLable = `chapter_${chapter}`;
                        if(!respObj[chaptLable]) {
                            respObj[chaptLable] = [];
                        }
                        respObj[chaptLable].push(row);
                    }
                    resolve({
                        word,
                        bookName,
                        totalOccurrences,
                        occurrences: respObj
                    });
                } else {
                    resolve(null);
                }
            }
        });
    });
}


function findOccurrencesInLXX({
    lemma
}) {
    const params = [];
    let sql = '';

    if(!lemma) {
        return Promise.reject('No lemma provided');
    }

    params.push(lemma);
    sql = `SELECT book_name, Count(*) as count FROM lxx_morphology WHERE lemma = ? GROUP BY book_name`;
    

    console.log('SQL:', sql);
    return new Promise((resolve, reject) => {
        lxxMorphDb.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (rows) {
                    resolve(rows);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function findOccurrencesInLXXBook({
    lemma,
    bookName
}) {
    const params = [bookName];
    let sql = '';

    if(!lemma) {
        return Promise.reject('No lemma provided');
    }

    params.push(lemma);
    strongsNumber = null;
    // sql = `SELECT * FROM lxx_morphology WHERE book_name = ? AND lemma = ? GROUP BY chapter`;
    sql = `SELECT * FROM lxx_morphology WHERE book_name = ? AND lemma = ?`;

    console.log('SQL:', sql);
    return new Promise((resolve, reject) => {
        lxxMorphDb.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Error fetching morphology:', err);
                reject(err);
            } else {
                if (rows) {
                    let respObj = {};
                    let totalOccurrences = rows.length;
                    let word = rows[0].lemma;
                    for(const row of rows) {
                        const chapter = row.chapter;
                        const chaptLable = `chapter_${chapter}`;
                        if(!respObj[chaptLable]) {
                            respObj[chaptLable] = [];
                        }
                        respObj[chaptLable].push(row);
                    }
                    resolve({
                        word,
                        bookName,
                        totalOccurrences,
                        occurrences: respObj
                    });
                } else {
                    resolve(null);
                }
            }
        });
    });
}

async function getAllLexiconEntries(greekWord) {
    const lsjEntries = await fetchLSJLexiconEntries(greekWord);
    const dodsonEntry = await fetchDodsonLexiconEntry({
        greekWordLemma: greekWord
    });
    const strongsEntry = await fetchStrongsLexiconEntry({
        greekWordLemma: greekWord
    });
    const thayerEntry = await fetchThayerLexiconEntry({strongsNumber: dodsonEntry?.strong_number })

    return {
        lsj: lsjEntries,
        dodson: dodsonEntry,
        strongs: strongsEntry,
        thayer: thayerEntry
    }
}

module.exports = {
    fetchLSJLexiconEntries,
    fetchDodsonLexiconEntry,
    fetchStrongsLexiconEntry,
    getAllLexiconEntries,
    findOccurrencesInGNT,
    findOccurrencesInGNTBook,
    findOccurrencesInLXX,
    findOccurrencesInLXXBook,
}