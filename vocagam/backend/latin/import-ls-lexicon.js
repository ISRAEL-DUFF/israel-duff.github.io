const fs = require('fs');
const path = require('path');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();

const filePath = path.join(__dirname, '../data/diogenes-data', 'lat.ls.perseus-eng1.xml'); // Adjust path if needed
// const xml = fs.readFileSync(filePath, 'utf8');

const xpath = require("xpath");
const { DOMParser } = require("xmldom");

const db = new sqlite3.Database('../data/database/latin_lexicon.db');

function createDb() {
    db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS ls_lexicon`);

    db.run(`
        CREATE TABLE ls_lexicon (
        id INTEGER PRIMARY KEY,
        word TEXT,
        macronized_word TEXT,
        xml_entry TEXT
        )
    `);

    // Add indexes for fast lookups
    db.run(`CREATE INDEX idx_word ON ls_lexicon(word)`);
    db.run(`CREATE INDEX idx_macronized_word ON ls_lexicon(macronized_word)`);

    console.log("✅ Database created");
    });

    db.close();
}



/**
 * Processes a file line by line using a stream.
 * @param {string} filePath - The path to the file to process.
 * @param {(line: string, lineNumber: number) => void} onLine - Callback for each line.
 * @returns {Promise<void>}
 */
async function processFileByLine(filePath, onLine) {
  return new Promise(async (resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNumber = 0;
    for await (const line of rl) {
        lineNumber++;
        onLine(line, lineNumber);

        console.log('Processed line:', lineNumber);

        // if(lineNumber > 20) {
        //     break;
        // }
    }

    resolve(lineNumber)
  })
}


function extractData(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const allNodes = xpath.select("./node()", doc);
    const div1 = allNodes.length === 1 ? allNodes[0] : allNodes[1];
    const headerList = xpath.select('./head', div1);
    // const header = headerList[0]

    let header = null;

    if (Array.isArray(headerList) && headerList.length > 0) {
        header = headerList[0];
    } else if(headerList) {
       header = headerList
    } else {
        throw new Error('No header found for:', xml)
    }

    if(header.nodeName !== 'head') {
        throw new Error("Header element not found")
    }

    return {
        word: header.textContent,
        macronizedWord: header.getAttribute('orth_orig'),
        xmlEntry: xml
    };

    // console.log(`✅ Parsed ${results.length} words from morphGNT`);
}


async function main() {
  db.serialize(async () => {
    const insert = db.prepare(`
      INSERT INTO ls_lexicon (word, macronized_word, xml_entry)
      VALUES (?, ?, ?)
    `);

    await processFileByLine(filePath, (line, i) => {
      const lexiconData = extractData(line);
      if (lexiconData && lexiconData.word) {
        insert.run(
          lexiconData.word,
          lexiconData.macronizedWord,
          lexiconData.xmlEntry
        );
      } else {
        throw new Error("Invalid lexicon Data")
      }
    });

    console.log("Finalizing...")
    insert.finalize();
    console.log(`✅ Done finalizing`);

    db.close();
  });
}

// main();

// createDb()
