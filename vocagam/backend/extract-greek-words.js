const fs = require('fs');
const xml2js = require('xml2js');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const axios = require("axios");

const client = new Client(process.env.DATABASE_URL);

let tableName = 'greek_morphology'


async function fetchQuery(whereParams = {}, limit = 10) {
    try {
        let whereCondition = `1=1` + Object.keys(whereParams).map((k) => ` AND "${k}" = '${whereParams[k]}'`).join(' ')
        // console.log(`SELECT * FROM ${tableName} WHERE ${whereCondition} LIMIT ${limit}`)
      const res = await client.query(`SELECT * FROM ${tableName} WHERE ${whereCondition} LIMIT ${limit}`);
    //   console.log(res.rows);

      return res.rows
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function extractGreekWordsFromXML(xmlFilePath) {
    const parser = new xml2js.Parser();
    const greekWords = [];
    const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]+/g; // Greek characters + diacritics
  
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
    const result = await parser.parseStringPromise(xmlContent);
  
    // Recursively walk through all <p> tags under <text><body>
    function extractFromParagraphs(node) {
      if (!node) return;
  
      if (Array.isArray(node)) {
        node.forEach(extractFromParagraphs);
      } else if (typeof node === 'object') {
        if ('p' in node) {
          const paragraphs = node.p;
          paragraphs.forEach(p => {
            const text = getTextContent(p);
            const matches = text.match(greekRegex);
            if (matches) {
              greekWords.push(...matches);
            }
          });
        } else {
          Object.values(node).forEach(extractFromParagraphs);
        }
      }
    }
  
    // Recursively extract all strings from mixed tag content
    function getTextContent(obj) {
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) return obj.map(getTextContent).join(' ');
      if (typeof obj === 'object') {
        return Object.values(obj).map(getTextContent).join(' ');
      }
      return '';
    }
  
    console.log(result)
    extractFromParagraphs(result['TEI.2']?.text?.[0]?.body?.[0]);
  
    return greekWords;
}

async function extractGreekWordsFromXML2(xmlFilePath) {
    const parser = new xml2js.Parser();
    const greekWords = [];
  
    const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]+/g;
  
    try {
      const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
      const result = await parser.parseStringPromise(xmlContent);
  
      function traverse(node) {
        if (typeof node === 'string') {
          const matches = node.match(greekRegex);
          if (matches) {
            greekWords.push(...matches);
          }
        } else if (Array.isArray(node)) {
          node.forEach(traverse);
        } else if (typeof node === 'object') {
          for (const key in node) {
            traverse(node[key]);
          }
        }
      }
  
      traverse(result);
  
      return greekWords;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return [];
    }
}


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

async function getMorphology(word) {
  if (!word) throw new Error("Missing 'word' parameter");

  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
        try {
            const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
            const response = await axios.get(url);
        
            // console.log(response.data)
            let parseResp = parsePerseusResponse(response.data);

            if(!parseResp[0]) {
                return reject(`word ${word} may not be greek`)
            }
        
            resolve({
                word,
                headWord: parseResp[0].lemma,
                morphData: parseResp
            });
        } catch (error) {
            reject(error)
        }
    }, 500)
  })

  
}

async function insertWordsIntoDB(wordData, sourceFile) {
    let wordProps = []

    if (Array.isArray(wordData.morphData)) {
        wordData.morphData.forEach(morph => {
            
          let morphText = `${morph.partOfSpeech}: ${morph.case} ${morph.number}, ${morph.gender}`;
          if(morph.partOfSpeech === 'verb' && morph.mood !== 'participle' && morph.mood !== 'infinitive') {
            morphText = `${morph.partOfSpeech}: ${morph.person} ${morph.number}, ${morph.tense}, ${morph.voice}, ${morph.mood}`;
            let txtD = {
                part_of_speech: 'verb',
                number: morph.number,
                person: morph.person,
                tense: morph.tense,
                voice: morph.voice,
                mood: morph.mood
            }
              if(morph.voice === 'mediopassive') {
                wordProps.push({
                    ...txtD,
                    voice: 'middle'
                })
                wordProps.push({
                    ...txtD,
                    voice: 'passive'
                })
              } else {
                wordProps.push(txtD)
              }
              
          } else if(morph.partOfSpeech === 'verb' && morph.mood === 'infinitive') {
              morphText = `${morph.partOfSpeech}: ${morph.tense}, ${morph.voice}, ${morph.mood}`;
              const txtD = {
                part_of_speech: 'verb',
                tense: morph.tense,
                mood: morph.mood,
                voice: morph.voice
            }

            if(morph.voice === 'mediopassive') {
                wordProps.push({
                    ...txtD,
                    voice: 'middle'
                })
                wordProps.push({
                    ...txtD,
                    voice: 'passive'
                })
              } else {
                wordProps.push(txtD)
              }
          } else if(morph.partOfSpeech === 'verb' && morph.mood === 'participle') {
              morphText = `${morph.partOfSpeech}: ${morph.tense}, ${morph.voice}, ${morph.mood} (${morph.case}, ${morph.gender}, ${morph.number} )`;
              let txtD = {
                    part_of_speech: 'participle',
                    number: morph.number,
                    person: morph.person,
                    tense: morph.tense,
                    voice: morph.voice,
                    mood: morph.mood,
                    case: morph.case,
                    number: morph.number,
                    gender: morph.gender
                }
                if(morph.voice === 'mediopassive') {
                    wordProps.push({
                        ...txtD,
                        voice: 'middle'
                    })
                    wordProps.push({
                        ...txtD,
                        voice: 'passive'
                    })
                  } else {
                    wordProps.push(txtD)
                  }
              
            } else if(morph.partOfSpeech === 'adverb') {
              morphText = `${morph.partOfSpeech}`;
              wordProps.push({
                part_of_speech: 'adverb',
            })
          } else if(morph.partOfSpeech === 'noun') {
            wordProps.push({
                part_of_speech: 'noun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender
            })
        } else if(morph.partOfSpeech === 'pronoun') {
            wordProps.push({
                part_of_speech: 'pronoun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender
            })
        } else if(morph.partOfSpeech === 'article') {
            wordProps.push({
                part_of_speech: 'article',
                case: morph.case,
                number: morph.number,
                gender: morph.gender
            })
        }
        else if(morph.partOfSpeech === 'adjective') {
            wordProps.push({
                part_of_speech: 'adjective',
                case: morph.case,
                number: morph.number,
                gender: morph.gender
            })
          }
        });
    }
  
    try {
        
        for(const wp of wordProps) {
            const wordsExist = await fetchQuery({
                ...wp,
                lemma: wordData.morphData[0].lemma,
                word: wordData.word
            });

            if(wordsExist.length > 0) {
                console.log('word ', wordData.word, 'already exist:', JSON.stringify(wordsExist[0]))
                continue
            }

            const { error } = await supabase.from(tableName).insert([
                {  
                    ...wp,
                    lemma: wordData.morphData[0].lemma,
                    word: wordData.word,
                    word_source: sourceFile,
                    meta_data: wordData
                }
                ]);
                if (error) {
                console.error(`Error inserting ${word}:`, error.message);
            }
          
            console.log(`✅ Inserted ${wordData.word} word into Supabase`);
        }

    } catch(e) {
        console.log(e)
    }
}

async function storeMorphData(wordList, source) {
    let startIndex = 498;
    let i = startIndex;
    for(let j = startIndex; j < wordList.length; j++) {
        const word = wordList[j]
        try {
            const morph = await getMorphology(word);
            await insertWordsIntoDB(morph, source);
            i++;
            console.log('processed', i);
        } catch(e) {
            console.log('error processing:', e.message)
        }
    }

    console.log({
        wordsProcessed: i
    })
}






// Example usage
// const xmlFilePath = './data/eusebius.xml'; // path to your Perseus XML file
const xmlFilePath = './data/eusiebus-book-1.xml'; // path to your Perseus XML file
extractGreekWordsFromXML2(xmlFilePath).then(async words => {
  console.log(`Extracted ${words.length} Greek words:`);
  console.log(words.slice(0, 10)); // preview first 20

  await client.connect();

  storeMorphData(words, 'eusebius_book_1').then((r) => console.log(r))
}).catch(async (e) => {
    console.log(e);
    await client.end();
});

