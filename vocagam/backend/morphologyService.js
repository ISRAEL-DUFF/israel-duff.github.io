const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client(process.env.DIRECT_DATABASE_URL);
let connectedToDb = false;
let tableName = 'greek_morphology'


// Path to store the data
const DATA_FILE = path.join(__dirname, '.data');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize empty data file if it doesn't exist
// if (!fs.existsSync(DATA_FILE)) {
//     fs.writeFileSync(DATA_FILE, JSON.stringify({ words: [] }));
// }

// Read all morphology data
function getAllMorphologyData(key) {
    
    try {
      // Initialize empty data file if it doesn't exist
        if (!fs.existsSync(`${DATA_FILE}/${key}.json`)) {
            fs.writeFileSync(`${DATA_FILE}/${key}.json`, JSON.stringify({ words: [] }));
        }
      
        const data = fs.readFileSync(`${DATA_FILE}/${key}.json`, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading morphology data:', error);
        return { words: [] };
    }
}

// Create new morphology entry
async function createMorphologyEntry(morph) {
    const {key, headWord, word, morphData, meanings} = morph;
    try {
        const data = getAllMorphologyData(key);
        const newEntry = {
            id: Date.now().toString(),
            headWord,
            word,
            morphData,
            meanings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.words.push(newEntry);
        fs.writeFileSync(`${DATA_FILE}/${key}.json`, JSON.stringify(data, null, 2));
        return newEntry;
    } catch (error) {
        console.error('Error creating morphology entry:', error);
        throw error;
    }
}

// Read a specific morphology entry
function getMorphologyEntry(key, word) {
    try {
        const data = getAllMorphologyData(key);
        return data.words.find(entry => entry.word === word || entry.headWord === word);
    } catch (error) {
        console.error('Error reading morphology entry:', error);
        return null;
    }
}

// Update a morphology entry
async function updateMorphologyEntry(morph) {
    const {key, word, newMorphData, newMeanings} = morph
    console.log(morph)
    try {
        const data = getAllMorphologyData(key);
        const index = data.words.findIndex(entry => entry.word === word || entry.headWord === word);
        
        if (index === -1) {
            throw new Error('Entry not found');
        }
        
        data.words[index] = {
            ...data.words[index],
            morphData: newMorphData ?? data.words[index].morphData,
            meanings: newMeanings ?? data.words[index].meanings,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(`${DATA_FILE}/${key}.json`, JSON.stringify(data, null, 2));
        return data.words[index];
    } catch (error) {
        console.error('Error updating morphology entry:', error);
        throw error;
    }
}

// Delete a morphology entry
function deleteMorphologyEntry(key, wordId) {
    try {
        const data = getAllMorphologyData(key);
        // const filteredWords = data.words.filter(entry => entry.word !== word && entry.headWord === word);
        const filteredWords = data.words.filter(entry => entry.id !== wordId);
        
        if (filteredWords.length === data.words.length) {
            throw new Error('Entry not found');
        }
        
        data.words = filteredWords;
        fs.writeFileSync(`${DATA_FILE}/${key}.json`, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error deleting morphology entry:', error);
        throw error;
    }
}

function listAllVocabsInfo() {
  const dirPath = DATA_FILE;
  try {
    const files = fs.readdirSync(dirPath);
    const jsonFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.json')
      .map(file => {
        const jsonName = path.parse(file).name
        const data = getAllMorphologyData(jsonName)
        
        return {
          name: jsonName,
          count: data.words.length
        }
      }); // Remove extension
    return jsonFiles;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}



// DATABASE MORPH DATA
function extractAlternatForms(morphData) {
    const wordData = morphData
    let wordProps = []
    
    if(!wordData) return []

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
                    gender: morph.gender,
                    declension: morph.declension
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
              morphText = `${morph.partOfSpeech}`;
              wordProps.push({
                part_of_speech: 'adverb',
            })
          } else if(morph.partOfSpeech === 'noun') {
            wordProps.push({
                part_of_speech: 'noun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                declension: morph.declension
            })
        } else if(morph.partOfSpeech === 'pronoun') {
            wordProps.push({
                part_of_speech: 'pronoun',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                // declension: morph.declension,
            })
        } else if(morph.partOfSpeech === 'article') {
            wordProps.push({
                part_of_speech: 'article',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                // declension: morph.declension
            })
        }
        else if(morph.partOfSpeech === 'adjective') {
            wordProps.push({
                part_of_speech: 'adjective',
                case: morph.case,
                number: morph.number,
                gender: morph.gender,
                declension: morph.declension,
            })
          }
        });
    }

    return wordProps;
}


async function fetchQuery(whereParams = {}, limit = 10) {
    try {
        if(!connectedToDb) {
            await client.connect();
            connectedToDb = true;
        }

        let whereCondition = `1=1`
        // let columns = 'id,is_mediopassive,word,' // + Object.keys(whereParams).join(',');
        let columns = `part_of_speech, is_mediopassive,"word","case","gender","tense","mood","voice","person","number","declension", "meta_data", "verb_type"`

        for(const k of Object.keys(whereParams)) {
            whereCondition += ` AND "${k}" = '${whereParams[k]}'`;
            // columns += `"${k}",`
        }
        // columns = columns.substring(0, columns.length - 1)

        console.log('filters', whereParams, Object.keys(whereParams).map((k) => ` AND "${k}" = '${whereParams[k]}'`))
      
      
      // 2. Get total count
      const countResult = await client.query(`SELECT COUNT(*) FROM greek_morphology WHERE ${whereCondition}`);
      const totalCount = parseInt(countResult.rows[0].count, 10);
      if (totalCount === 0) return [];
      
      
      // 3. Compute page count
      const pageSize = limit;
      const totalPages = Math.floor(totalCount / pageSize);
      const randomPage = Math.floor(Math.random() * totalPages);
      const offset = randomPage * pageSize;
      
      
      // 4. Fetch random page
      const query = `
        SELECT ${columns} FROM greek_morphology
        WHERE ${whereCondition}
        OFFSET ${offset}
        LIMIT ${pageSize}
      `;

        console.log(query)
        const oldQuery = `SELECT ${columns} FROM ${tableName} WHERE ${whereCondition} LIMIT ${limit}`;
      const res = await client.query(query);

      return res.rows
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}

async function fetchGreekMorphs(filters) {
  function removeNullValues(jsonData) {
    return Object.fromEntries(
                Object.entries(jsonData).filter(([_, value]) => value != null && value != undefined)
    )
  }
  
  const data = await fetchQuery(filters, 30)
  
  const mappedData = data.map((d) => {
    const cleanD = removeNullValues(d);
    const checkStr = Object.values({
      ...cleanD,
      meta_data: undefined,
      word: undefined,
      verb_type: undefined
    }).sort().join('');
    
    const uniqueChecks = {}
    const alternates = extractAlternatForms(d.meta_data).sort().filter((a) => {
      const currentStrCheck = Object.values(removeNullValues(a)).sort().join('');
      // console.log(checkStr, currentStrCheck)
      // console.log({
      //   partOfSpeechCheck: a.partOfSpeech === d.part_of_speech,
      //   partOfSpeech: a.partOfSpeech,
      //   part_of_speech: d.part_of_speech,
      //   d
      // })
      
      const result = currentStrCheck !== checkStr && !uniqueChecks[currentStrCheck] && a.part_of_speech === d.part_of_speech

      uniqueChecks[currentStrCheck] = currentStrCheck;
      
      return result
    })
    
    return {
      alternates,
      ...cleanD,
      meta_data: undefined
    }
  });
  
  // REmove Duplicate words
  let filterMap = {};
  let resultData = [];
  for(const d of mappedData) {
    if(!filterMap[d.word]) {
      resultData.push(d);
      filterMap[d.word] = d.word
    }
  }
  
  return resultData
}

module.exports = {
    createMorphologyEntry,
    getMorphologyEntry,
    updateMorphologyEntry,
    deleteMorphologyEntry,
    getAllMorphologyData,
   listAllVocabsInfo,
  fetchGreekMorphs
};