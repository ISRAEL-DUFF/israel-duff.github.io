const fs = require("fs");
const readline = require("readline");
const { parseStringPromise } = require("xml2js");
// const betacode = require("betacode"); // Make sure your working lib resolves betacode -> Unicode
const { betaCodeToGreek, greekToBetaCode, unicodeToBetaCode } = require('beta-code-js');
const { distance } = require("fastest-levenshtein");
const { createClient } = require('@supabase/supabase-js');
const { extractEntry } = require("./lsj-extractor");
require('dotenv').config();


const LSJ_PATH = "./data/grc.lsj.xml"; // path to your full LSJ XML file
const INDEX_PATH = "./data/lsj_index_2.json";

function normalizeGreek(lemma) {
  const unicode = betaCodeToGreek(lemma);
  return unicode
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Script=Greek}]/gu, "")
    .toLowerCase();
}

// Returns the N closest matches sorted by distance
function getClosestMatches(query, candidates, maxDistance = 3, topN = 5) {
    return candidates
      .map(word => ({ word, dist: distance(query, word) }))
      .filter(entry => entry.dist <= maxDistance)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, topN);
}

async function readEntryAtOffset(displayKey, offset) {
    const file = fs.openSync(LSJ_PATH, "r");
    const stream = fs.createReadStream(null, {
      fd: file,
      start: offset,
      encoding: "utf8",
    });
  
    const rl = readline.createInterface({ input: stream });
  
    let entryBlock = "";
    let capturing = false;
  
    for await (const line of rl) {
      if (line.includes("<div2")) capturing = true;
      if (capturing) {
        entryBlock += line + "\n";
        if (line.includes("</div2>")) break;
      }
    }
  
    // fs.closeSync(file);
  
    const wrappedXml = `<root>${entryBlock}</root>`;
    const json = await parseStringPromise(wrappedXml, {
      mergeAttrs: true,
      explicitArray: false,
      preserveChildrenOrder: true,
      charsAsChildren: true,
    });
  
    return {
      key: displayKey,
      entry: json.root.div2,
      xml: entryBlock
    };
}

async function readEntryAtOffset2(displayKey, offset) {
    const file = fs.openSync(LSJ_PATH, "r");
    const stream = fs.createReadStream(null, {
      fd: file,
      start: offset,
      encoding: "utf8",
    });
  
    const rl = readline.createInterface({ input: stream });
  
    let entryBlock = "";
    let capturing = false;
  
    for await (const line of rl) {
      if (line.includes("<div2")) capturing = true;
      if (capturing) {
        entryBlock += line + "\n";
        if (line.includes("</div2>")) break;
      }
    }
    // console.log(entryBlock);
    // fs.closeSync(file);
  
    const entry = await extractEntry(entryBlock);
  
    return {
      key: displayKey,
      entry,
      xml: entryBlock
    };
}

// async function lookupHeadword(rawQuery) {
//     const query = normalizeGreek(rawQuery);
//     const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  
//     const offset = index[query];
//     if (offset == null) throw new Error(`No LSJ entry found for: ${rawQuery}`);
  
//     const file = fs.openSync(LSJ_PATH, "r");
//     const stream = fs.createReadStream(null, {
//       fd: file,
//       start: offset,
//       encoding: "utf8",
//     });
  
//     const rl = readline.createInterface({ input: stream });
  
//     let entryBlock = "";
//     let capturing = false;
  
//     for await (const line of rl) {
//       if (line.includes("<div2")) capturing = true;
//       if (capturing) {
//         entryBlock += line + "\n";
//         if (line.includes("</div2>")) break;
//       }
//     }
  
//     fs.closeSync(file);
  
//     const wrappedXml = `<root>${entryBlock}</root>`;
//     const json = await parseStringPromise(wrappedXml, {
//       mergeAttrs: true,
//       explicitArray: false,
//       preserveChildrenOrder: true,
//       charsAsChildren: true,
//     });
  
//     return {
//       key: rawQuery,
//       entry: json.root.div2,
//     };
//   }

async function lookupHeadword(rawQuery) {
    const query = normalizeGreek(rawQuery);
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  
    const offset = index[query];
    if (offset != null) {
      return await readEntryAtOffset(query, offset);
    }
  
    // Fuzzy fallback with suggestions
    const candidates = Object.keys(index);
    const matches = getClosestMatches(query, candidates, 3, 5);
  
    if (matches.length > 0) {
      console.warn(`No exact match for "${rawQuery}". Suggestions:`);
  
      for (const match of matches) {
        console.warn(`→ ${match.word} (distance: ${match.dist})`);
      }
  
      // Optionally return the best match
      const best = matches[0];
      const entry = await readEntryAtOffset(best.word, index[best.word]);
      return {
        ...entry,
        suggestions: matches.map(m => m.word),
      };
    }
  
    throw new Error(`No LSJ entry found or close matches for: ${rawQuery}`);
}
  


async function buildIndex(normalize = false) {
    const index = {};
    const stream = fs.createReadStream(LSJ_PATH);
    const rl = readline.createInterface({ input: stream });
  
    let byteOffset = 0;
  
    for await (const line of rl) {
      const keyMatch = line.match(/<div2[^>]*key="([^"]+)"/);
      if (keyMatch) {
        const betaKey = keyMatch[1];
        if(normalize) {
            const normalized = normalizeGreek(betaKey);
            index[normalized] = byteOffset;
        } else {
            const unicode = betaCodeToGreek(betaKey);
            index[unicode] = byteOffset;
        }
      }
      byteOffset += Buffer.byteLength(line, "utf8") + 1; // account for newline
    }
  
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
    console.log(`Index written to ${INDEX_PATH} with ${Object.keys(index).length} entries`);
}

// buildIndex().then(() => {
//     console.log("Index built successfully");
// }).catch(console.error);


// (async () => {
//   const query = "a)/lfa"; // try others like "a)a/katos"
//   try {
//     const result = await lookupHeadword(query);
//     console.log(JSON.stringify(result, null, 2));
//   } catch (err) {
//     console.log(err);
//     // console.error("Error:", err.message);
//   }
// })();

async function lookupHeadwordByGreek(greekWordRawQuery) {
    const greekBetaCodeQuery = greekToBetaCode(greekWordRawQuery);
  try {
    const result = await lookupHeadword(greekBetaCodeQuery);
    // console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.log(err);
    // console.error("Error:", err.message);
    return null;
  }
}

async function lookupHeadwordByGreek2(greekWordRawQuery) {
  try {
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
    const offset = index[greekWordRawQuery];
    const result = await readEntryAtOffset2(greekWordRawQuery, offset);
    // console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.log(err);
    // console.error("Error:", err.message);
    return null;
  }
}

async function storeLexicaData() {
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
    const tableName = "lsj_lexicon";
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const keys = Object.keys(index);
    const total = keys.length;
    // const startIndex = 15790;   <<< FROM INDEX 0 - 15790 contains old json format that needs to be updated >>>
    const startIndex = 0;
    for(let i = startIndex; i < total; i++) {
        const key = keys[i];
        const offset = index[key];
        const entryData = await readEntryAtOffset(key, offset);

        const { error } = await supabase.from(tableName).insert([
            {  
                word: key,
                beta_code: greekToBetaCode(key),
                normalized_word: normalizeGreek(key),
                // json_entry: entryData.entry,
                xml_entry: entryData.xml,
            }
        ]);

        if (error) {
            console.error(`Error inserting ${key}:`, error.message);
        } else {
            console.log(`Inserted ${key} at index ${i} / ${total}`);
        }
    }

    // throw new Error(`No LSJ entry found or close matches for: ${rawQuery}`);
}

// storeLexicaData().then(() => {
//     console.log("Lexica data stored successfully");
// }).catch(console.error);

module.exports = {
    lookupHeadwordByBetaCode: lookupHeadword,
    lookupHeadwordByGreek: lookupHeadwordByGreek,
    lookupHeadwordByGreek2: lookupHeadwordByGreek2,
    buildIndex
}
