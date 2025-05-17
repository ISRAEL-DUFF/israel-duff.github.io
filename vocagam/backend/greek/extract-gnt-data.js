const fs = require('fs');
const path = require('path');
// const { XMLParser } = require('fast-xml-parser');

const filePath = path.join(__dirname, '../data/morphGNT/tischendorf-data-master/OSIS-XML/2.8', 'tischendorfmorph.OSIS.xml'); // Adjust path if needed
const xml = fs.readFileSync(filePath, 'utf8');

const xpath = require("xpath");
const { DOMParser } = require("xmldom");
const { parseMorphCode } = require('./robinson-parser');


function extractData(insertData) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const xpathSelect = xpath.useNamespaces({osis: "http://www.bibletechnologies.net/2003/OSIS/namespace"});

    const books = xpathSelect("//osis:div[@type='book']", doc);// xpath.select("//div[@type='book']", doc);
    const results = [];

    console.log(`Found ${books.length} books in the XML file.`);

    books.forEach(book => {
        const bookName = xpathSelect("./osis:title", book)[0].textContent;
        let chapter = '';
        let verse = '';

        const chapterSegments = xpathSelect(".//osis:p", book);
        console.log(`Found ${chapterSegments.length} chapter segments in ${bookName}.`);

        chapterSegments.forEach(chapterSegment => {
            // console.log(`Found ${chapterSegment.nodeName} in ${bookName}.`);
            const nodes = xpathSelect("./node()", chapterSegment);
            let verses = [];
            nodes.forEach(async node => {
                if (node.nodeName === 'verse') { // Verse node
                    const osisID = node.getAttribute("osisID");
                    if (osisID) {
                        const [_, chapterNum, verseNum] = osisID.split('.');
                        chapter = chapterNum;
                        verse = verseNum;
                        verses = [];
                    } else {
                        // console.log(`❌ No osisID found in ${node}`);
                    }
                    
                } else if (node.nodeName === 'w') { // word node
                    const wordText = node.textContent;
                    const lemma = node.getAttribute("lemma");
                    let morphCode = node.getAttribute("morph");

                    let [strongNum, lemmaText] = lemma.split(' ');
                    strongNum = strongNum.replace('strong:', '');
                    lemmaText = lemmaText.replace('lemma:', '');
                    morphCode = morphCode.replace('robinson:', '');

                    let data = {
                        book: bookName,
                        chapter: parseInt(chapter),
                        verse: parseInt(verse),
                        word: wordText,
                        lemma: lemmaText,
                        morph: morphCode,
                        strongNumber: strongNum,
                        morphology: parseMorphCode(morphCode)
                    }

                    results.push(data)

                    if(insertData) {
                        await insertData(data)
                    }
                    
                }
            })
        }
        );
    });

    fs.writeFileSync('../data/greek-new-testament-morph3.json', JSON.stringify(results, null, 2), 'utf8');
    console.log(`✅ Parsed ${results.length} words from morphGNT`);
}

// fs.writeFileSync('parsed_1Chr.json', JSON.stringify(output, null, 2), 'utf8');
// console.log(`✅ Parsed ${output.length} words from 1 Chronicles`);

// extractData();




const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../data/database/gnt_morph.db');

db.serialize(async () => {
  db.run(`DROP TABLE IF EXISTS new_testament_morphology`);
  db.run(`
    CREATE TABLE new_testament_morphology (
      id INTEGER PRIMARY KEY,
      strong_number TEXT,
      morph_code TEXT,
      greek_word TEXT,
      lemma TEXT,
      part_of_speech TEXT,
      tense TEXT NULL,
      voice TEXT NULL,
      mood TEXT NULL,
      person TEXT NULL,
      number TEXT NULL,
      "case" TEXT NULL,
      gender TEXT NULL,
      meta_data JSONB,
      book_name TEXT,
      chapter TEXT,
      verse TEXT
    )
  `);

  const insertQuery = `
    INSERT INTO new_testament_morphology (
        strong_number,
        morph_code,
        greek_word,
        lemma,
        part_of_speech,
        tense,
        voice,
        mood,
        person,
        "number",
        "case",
        gender,
        meta_data,
        book_name,
        chapter,
        verse
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertData = (bookData) => {
        const d = {
            "book": "Matthew",
            "chapter": 9,
            "verse": 18,
            "word": "ἡ",
            "lemma": "ὁ",
            "morph": "T-NSF",
            "morphology": {
              "partOfSpeech": "Article",
              "case": "Nominative",
              "number": "Singular",
              "gender": "Feminine",
              "type": " "
            }
          };

        const data = [
            bookData.strongNumber,
            bookData.morph,
            bookData.word,  // beta_code_word
            bookData.lemma, // beta_code_lemma
            bookData.morphology.partOfSpeech,            // part_of_speech
            bookData.morphology.tense,         // tense
            bookData.morphology.voice,          // voice
            bookData.morphology.mood,              // mood
            bookData.morphology.person,              // person
            bookData.morphology.number,        // number
            bookData.morphology.case,      // case
            bookData.morphology.gender,       // gender
            JSON.stringify(bookData), // meta_data
            bookData.book,
            bookData.chapter,
            bookData.verse
            ]
        return new Promise((resolve, reject) => {
            db.run(insertQuery, data, function (err) {
                if (err) {
                    console.error('Error inserting data:', err.message);
                    reject(err)
                } else {
                    // console.log('Row inserted with ID:', this.lastID);
                    resolve(this.lastID)
                }
                });
        })
    }

    extractData(insertData);


    // Add indexes for fast lookups
    db.run(`CREATE INDEX idx_morph_code ON new_testament_morphology(morph_code)`);
    db.run(`CREATE INDEX idx_greek_word ON new_testament_morphology(greek_word)`);
    db.run(`CREATE INDEX idx_part_of_speech ON new_testament_morphology(part_of_speech)`);
    db.run(`CREATE INDEX idx_tense_voice_mood ON new_testament_morphology(tense, voice, mood)`);

    db.close();

  console.log("✅ Database created and populated.");
});
