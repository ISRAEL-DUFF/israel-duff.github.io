const fs = require('fs');
const xml2js = require('xml2js');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const axios = require("axios");

const client = new Client(process.env.DIRECT_DATABASE_URL);

// let tableName = 'greek_morphology'
let tableName = 'biblical_greek_morphology'

const sqlVerbTypes = `UPDATE greek_morphology
SET verb_type = CASE
    WHEN lemma IN (
    'εἰμί',    -- to be
    'οἶδα',    -- to know
    'φημί',    -- to say
    'ἔρχομαι', -- to come, go
    'βαίνω',   -- to go, walk
    'τίθημι',  -- to place, put
    'δίδωμι',  -- to give
    'ἵστημι',  -- to stand, set up
    'ἵημι',    -- to send, let go
    'λαμβάνω', -- to take, receive
    'λέγω',    -- to say
    'ὁράω',    -- to see
    'φέρω',    -- to bear, carry
    'ἀφικνέομαι', -- to arrive
    'γίγνομαι',   -- to become, happen
    'τρέχω',      -- to run
    'πίνω',       -- to drink
    'πίπτω',      -- to fall
    'μανθάνω',    -- to learn
    'τυγχάνω',    -- to happen, hit
    'τυφλός εἰμι',-- (idiomatically irregular usage)
    'λανθάνω',    -- to escape notice
    'λανθάνομαι', -- passive of λανθάνω
    'λανθάνοιμι', -- optative form irregularity
    'δεικνύω',    -- to show
    'ἐσθίω',      -- to eat
    'ἀποθνῄσκω',  -- to die
    'θνῄσκω',     -- to die (poetic shorter form)
    'καίω',       -- to burn (future καύσω is irregular)
    'ἁλίσκομαι',  -- to be captured
    'γίγνομαι',   -- to become
    'ἁμαρτάνω',   -- to miss, err
    'εὑρίσκω',    -- to find
    'τίκτω',      -- to give birth
    'τίλλω',      -- to pluck (very rare)
    'ἀγείρω',     -- to gather
    'ἀγγέλλω',    -- to announce
    'ἕπομαι',     -- to follow
    'ἀνίστημι',   -- to raise up
    'καθίστημι',  -- to appoint, establish
    'διαφθείρω'   -- to destroy
    ) THEN 'irregular'
    WHEN lemma LIKE '%μι' THEN 'mi'
    WHEN lemma LIKE '%άω' OR lemma LIKE '%έω' OR lemma LIKE '%όω' THEN 'contract'
    WHEN lemma LIKE '%νω' OR lemma LIKE '%λω' OR lemma LIKE '%ρω' OR lemma LIKE '%μω' THEN 'liquid'
    WHEN lemma LIKE '%ω' THEN 'w'
    ELSE NULL
END
WHERE part_of_speech IN ('verb', 'participle', 'infinitive');
`
function classifyVerbType(lemma) {
    const irregularVerbs = [
        'εἰμί', 'οἶδα', 'φημί', 'ἔρχομαι', 'βαίνω', 'τίθημι', 'δίδωμι', 
        'ἵστημι', 'ἵημι', 'λαμβάνω', 'λέγω', 'ὁράω', 'φέρω', 'ἀφικνέομαι', 
        'γίγνομαι', 'τρέχω', 'πίνω', 'πίπτω', 'μανθάνω', 'τυγχάνω', 
        'τυφλός εἰμι', 'λανθάνω', 'λανθάνομαι', 'λανθάνοιμι', 'δεικνύω', 
        'ἐσθίω', 'ἀποθνῄσκω', 'θνῄσκω', 'καίω', 'ἁλίσκομαι', 'γίγνομαι', 
        'ἁμαρτάνω', 'εὑρίσκω', 'τίκτω', 'τίλλω', 'ἀγείρω', 'ἀγγέλλω', 
        'ἕπομαι', 'ἀνίστημι', 'καθίστημι', 'διαφθείρω'
    ];

    if (irregularVerbs.includes(lemma)) {
        return 'irregular';
    } else if (lemma.endsWith('μι')) {
        return 'mi';
    } else if (lemma.endsWith('άω') || lemma.endsWith('έω') || lemma.endsWith('όω')) {
        return 'contract';
    } else if (lemma.endsWith('νω') || lemma.endsWith('λω') || lemma.endsWith('ρω') || lemma.endsWith('μω')) {
        return 'liquid';
    } else if (lemma.endsWith('ω')) {
        return 'w';
    }
    
    return null;
}


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

async function updateFrequency(id, frequency) {
    try {
        const res = await client.query(`UPDATE ${tableName} SET morphology_frequency = ${frequency} WHERE id = ${id}`);
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
        declension: infl?.decl?.["$"],
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
    }, 100)
  })

  
}

async function insertWordsIntoDB(wordData, sourceFile) {
    let wordProps = []

    if (Array.isArray(wordData.morphData)) {
        wordData.morphData.forEach(morph => {
          if(morph.partOfSpeech === 'verb' && morph.mood !== 'participle' && morph.mood !== 'infinitive') {
            let txtD = {
                lemma: morph.lemma,
                part_of_speech: 'verb',
                number: morph.number,
                person: morph.person,
                tense: morph.tense,
                voice: morph.voice,
                mood: morph.mood,
                verb_type: classifyVerbType(morph.lemma)
            }
              if(morph.voice === 'mediopassive') {
                wordProps.push({
                    ...txtD,
                    voice: 'middle',
                    is_mediopassive: true
                })
                wordProps.push({
                    ...txtD,
                    voice: 'passive',
                    is_mediopassive: true
                })
              } else {
                wordProps.push(txtD)
              }
              
          } else if(morph.partOfSpeech === 'verb' && morph.mood === 'infinitive') {
              const txtD = {
                lemma: morph.lemma,
                part_of_speech: 'infinitive',
                tense: morph.tense,
                mood: morph.mood,
                voice: morph.voice,
                verb_type: classifyVerbType(morph.lemma)
            }

            if(morph.voice === 'mediopassive') {
                wordProps.push({
                    ...txtD,
                    voice: 'middle',
                    is_mediopassive: true
                })
                wordProps.push({
                    ...txtD,
                    voice: 'passive',
                    is_mediopassive: true
                })
              } else {
                wordProps.push(txtD)
              }
          } else if(morph.partOfSpeech === 'verb' && morph.mood === 'participle') {
              let txtD = {
                    lemma: morph.lemma,
                    part_of_speech: 'participle',
                    number: morph.number,
                    person: morph.person,
                    tense: morph.tense,
                    voice: morph.voice,
                    mood: morph.mood,
                    case: morph.case,
                    number: morph.number,
                    gender: morph.gender,
                    declension: morph.declension,
                    verb_type: classifyVerbType(morph.lemma)
                }
                if(morph.voice === 'mediopassive') {
                    wordProps.push({
                        ...txtD,
                        voice: 'middle',
                        is_mediopassive: true
                    })
                    wordProps.push({
                        ...txtD,
                        voice: 'passive',
                        is_mediopassive: true
                    })
                  } else {
                    wordProps.push(txtD)
                  }
              
            } else if(morph.partOfSpeech === 'adverb') {
              wordProps.push({
                lemma: morph.lemma,
                part_of_speech: 'adverb',
            })
          } else if(morph.partOfSpeech === 'noun') {
            wordProps.push({
                lemma: morph.lemma,
                part_of_speech: 'noun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                declension: morph.declension
            })
        } else if(morph.partOfSpeech === 'pronoun') {
            wordProps.push({
                lemma: morph.lemma,
                part_of_speech: 'pronoun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                // declension: morph.declension,
            })
        } else if(morph.partOfSpeech === 'article') {
            wordProps.push({
                lemma: morph.lemma,
                part_of_speech: 'article',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                // declension: morph.declension
            })
        }
        else if(morph.partOfSpeech === 'adjective') {
            wordProps.push({
                lemma: morph.lemma,
                part_of_speech: 'adjective',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                declension: morph.declension,
            })
          }
        });
    }
  
    try {
        
        for(const wp of wordProps) {
            const queryParams = {
                ...wp,
                // lemma: wordData.morphData[0].lemma,
                word: wordData.word
            };
            
            // Remove null/undefined fields
            const cleanParams = Object.fromEntries(
                Object.entries(queryParams).filter(([_, value]) => value != null && value != undefined)
            );

            const wordsExist = await fetchQuery(cleanParams);

            if(wordsExist.length > 0) {
                // console.log('word ', wordData.word, 'already exist:', JSON.stringify(wordsExist[0]))
                console.log('word ', wordData.word, 'already exist with ID:', JSON.stringify(wordsExist[0].id));

                // TODO: update the word morphology frequency
                await updateFrequency(wordsExist[0].id, wordsExist[0].morphology_frequency + 1);

                continue
            }

            const { error } = await supabase.from(tableName).insert([
                {  
                    ...wp,
                    // lemma: wordData.morphData[0].lemma,
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
    // 14000
    let startIndex = 46483;
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

// const xmlFilePath = './data/eusebius-book-3.xml'; // path to your Perseus XML file
// extractGreekWordsFromXML2(xmlFilePath).then(async words => {
//   console.log(`Extracted ${words.length} Greek words:`);
//   console.log(words.slice(0, 10)); // preview first 20

//   await client.connect();

//   storeMorphData(words, 'eusebius_book_3').then((r) => console.log(r))
// }).catch(async (e) => {
//     console.log(e);
//     await client.end();
// });



async function readWordsFromJSON(filePath) {
    const words = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // return words.map(w => w.word)
    return words
}

readWordsFromJSON('./data/greet_nt_words.json').then(async words => {
    console.log(`Extracted ${words.length} Greek words:`);
    console.log(words.slice(0, 10)); // preview first 10
    await client.connect();
    await storeMorphData(words, 'greek_new_testament');
    await client.end();
}).catch(async (e) => {
    console.log(e);
    await client.end();
})


/// MEDIO PASSIVES: 1,929 records
// τοῦ, τῶν, Τὰ

