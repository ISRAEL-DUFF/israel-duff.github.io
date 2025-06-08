const axios = require("axios")
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR='../data/database'
const dbLexiconPath = path.join(__dirname, DATA_DIR, 'latin_lexicon.db')
const latinLexiconDb = new sqlite3.Database(dbLexiconPath);

function normalizeLemma(lemma) {
  return lemma.replace(/\d+$/, '');
}

// <<<< MORPHESEUS >>>>
function parsePerseusResponse(response) {
    const body = response?.RDF?.Annotation?.Body;
    if (!body) return [];

    const bodyList = Array.isArray(body) ? body : [body];
    const rawOutput = bodyList.flatMap(bodyItem => {
    const entry = bodyItem.rest?.entry;
    const dict = entry?.dict || {};
    const infls = Array.isArray(entry?.infl) ? entry.infl : [entry?.infl].filter(Boolean);

    const base = {
        lemma: dict.hdwd?.["$"] || null,
        partOfSpeech: dict.pofs?.["$"] || null
    };

    return infls.map(infl => ({
        ...base,
        case: infl?.case?.["$"] || null,
        gender: infl?.gend?.["$"] || null,
        number: infl?.num?.["$"] || null,
        tense: infl?.tense?.["$"] || null,
        voice: infl?.voice?.["$"] || null,
        mood: infl?.mood?.["$"] || null,
        person: infl?.pers?.["$"] || null,
        stem: infl?.term?.stem?.["$"] || null,
        suffix: infl?.term?.suff?.["$"] || null,
        morph: infl?.morph?.["$"] || null,
        stemtype: infl?.stemtype?.["$"] || null,
        derivtype: infl?.derivtype?.["$"] || null,
        dialect: infl?.dial?.["$"] || null
    }));
    });

    // remove null fields
    return rawOutput.map((o) => {
        let d = {}
        for(const k of Object.keys(o)) {
            if(o[k]) {
                d[k] = o[k]
            }
        }

        return d;
    })
}

async function getPerseusMorph(word) {
    if (!word) {
        throw new Error('Word cannot be empty')
    }

    try {
        // const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
        const url = `http://localhost:1500/analysis/word?lang=lat&engine=morpheuslat&word=${encodeURIComponent(word)}`;
        
        const resRaw = await axios.get(url);
        let response = resRaw.data;
        let parsedResp = parsePerseusResponse(response);
        
        return parsedResp;
    } catch (error) {
        console.log(error)
    }
}

async function processLexiconEntry(xml_entry) {
    let htmlText = xml_entry.replaceAll('<div1', '<div class="latin-lexicon-entry"')
    htmlText = htmlText.replaceAll('</div1>', '</div>');

    htmlText = htmlText.replaceAll('<head', '<span class="latin-word"')
    htmlText = htmlText.replaceAll('</head>', '</span>');
    htmlText = htmlText.replaceAll('<itype', '<span class="latin-word"')
    htmlText = htmlText.replaceAll('</itype>', '</span>');

    htmlText = htmlText.replaceAll('<i>', '<i class="latin-gloss-sense">')

    htmlText = htmlText.replaceAll('<sense', '<p class="sense-section"');
    htmlText = htmlText.replaceAll('</sense>', '</p');

    return htmlText;
}

function fetchLSLexiconEntries(latinWord) {
    return new Promise((resolve, reject) => {
        const normalizedWord = latinWord
        let columns = `word, macronized_word, xml_entry`
        const queryParams = [normalizedWord, latinWord]
        let whereCondition = `macronized_word = ? OR word = ?`
        
        const sql = `
        SELECT ${columns} FROM ls_lexicon
        WHERE ${whereCondition}
        `;
        latinLexiconDb.all(sql, queryParams, async (err, rows) => {
            if (err) {
                console.error('Error fetching lexicon entry:', err);
                reject(err);
            } else {
                if (rows && rows.length > 0) {
                    for(const row of rows) {
                        row.htmlText = await processLexiconEntry(row.xml_entry);
                        row.macronizedWord = row.macronized_word;

                        row.macronized_word = undefined;
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

async function getAllLexiconEntries(latinWord) {
    const lsEntries = await fetchLSLexiconEntries(latinWord);

    return {
        lewisAndShort: lsEntries,
    }
}

async function fetchLexiconEntryWithMorphData(latinWord) {
  const morphology = await getPerseusMorph(latinWord)
  if(!morphology[0]?.lemma) {
    throw new Error("Invalid word")
  }
  
  const lexica = {}
  
  for(const morphEntry of morphology) { 
	let lemma = normalizeLemma(morphEntry.lemma)
	const lexEntries = await getAllLexiconEntries(lemma)
	lexica[lemma] = lexEntries;
  }
  
  return {
    lexica,
    morphology
  }
}

module.exports = {
    fetchLexiconEntryWithMorphData
}