const fs = require('fs');
const { betaCodeToGreek } = require('beta-code-js');
const { parseLXXMorphCode } = require('./catss-morph-parser.js');

// const bookNameMap = {
//     "gen": "Genesis",
//     "exo": "Exodus",
//     "lev": "Leviticus",
//     "num": "Numbers",
//     "deu": "Deuteronomy",
//     "jos": "Joshua",
//     "jdg": "Judges",
//     "rut": "Ruth",
//     "1sa": "1 Samuel",
//     "2sa": "2 Samuel",
//     "1ki": "1 Kings",
//     "2ki": "2 Kings",
//     "1ch": "1 Chronicles",
//     "2ch": "2 Chronicles",
//     "ezr": "Ezra",
//     "neh": "Nehemiah",
//     "est": "Esther",
//     "job": "Job",
//     "psa": "Psalms",
//     "pro": "Proverbs",
//     "ecc": "Ecclesiastes",
//     "sng": "Song of Songs",
//     "wis": "Wisdom of Solomon",
//     "sir": "Sirach",
//     "isa": "Isaiah",
//     "jer": "Jeremiah",
//     "lam": "Lamentations",
//     "bar": "Baruch",
//     "ezk": "Ezekiel",
//     "dan": "Daniel",
//     "hos": "Hosea",
//     "jol": "Joel",
//     "amo": "Amos",
//     "oba": "Obadiah",
//     "jon": "Jonah",
//     "mic": "Micah",
//     "nam": "Nahum",
//     "hab": "Habakkuk",
//     "zep": "Zephaniah",
//     "hag": "Haggai",
//     "zec": "Zechariah",
//     "mal": "Malachi",
//     "1ma": "1 Maccabees",
//     "2ma": "2 Maccabees",
//     "3ma": "3 Maccabees",
//     "4ma": "4 Maccabees",
//     "tob": "Tobit",
//     "jdt": "Judith",
//     "sus": "Susanna",
//     "bel": "Bel and the Dragon",
//     "man": "Prayer of Manasseh",
//     "addesth": "Additions to Esther",
//     "epjer": "Epistle of Jeremiah"
// }
const bookNameMap = {
    "Gen": "Genesis",
    "Exod": "Exodus",
    "Lev": "Leviticus",
    "Num": "Numbers",
    "Deut": "Deuteronomy",
    "Josh": "Joshua",
    "JoshA": "Joshua",
    "JoshB": "Joshua",
    "JudgA": "Judges",
    "JudgB": "Judges",
    "Ruth": "Ruth",
    "1Sam/K": "1 Samuel",
    "2Sam/K": "2 Samuel",
    "1Kgs": "1 Kings",
    "2Kgs": "2 Kings",
    "1/3Kgs": "1 Kings",
    "2/4Kgs": "2 Kings",
    "1Chr": "1 Chronicles",
    "2Chr": "2 Chronicles",
    "1Esdr": "1 Esdras",
    "2Esdr": "2 Esdras",
    "Neh": "Nehemiah",
    "Ezra": "Ezra",
    "Tob": "Tobit",
    "TobBA": "Tobit",
    "TobS": "Tobit",
    "Jdt": "Judith",
    "Esth": "Esther",
    "Job": "Job",
    "Ps": "Psalms",
    "Prov": "Proverbs",
    "Eccl": "Ecclesiastes",
    "Song": "Song of Songs",
    "Wis": "Wisdom of Solomon",
    "Sir": "Sirach",
    "Isa": "Isaiah",
    "Jer": "Jeremiah",
    "Bar": "Baruch",
    "Lam": "Lamentations",
    "EpJer": "Letter of Jeremiah",
    "Ezek": "Ezekiel",
    "Dan": "Daniel (Old Greek)",
    "DanTh": "Daniel (Theodotion)",
    "Bel": "Bel and the Dragon (Old Greek)",
    "Belth": "Bel and the Dragon (Theodotion)",
    "Sus": "Susanna (Old Greek)",
    "SusTh": "Susanna (Theodotion)",
    "PrAzar": "Prayer of Azariah",
    "Hos": "Hosea",
    "Joel": "Joel",
    "Amos": "Amos",
    "Obad": "Obadiah",
    "Jonah": "Jonah",
    "Mic": "Micah",
    "Nah": "Nahum",
    "Hab": "Habakkuk",
    "Zeph": "Zephaniah",
    "Hag": "Haggai",
    "Zech": "Zechariah",
    "Mal": "Malachi",
    "1Mac": "1 Maccabees",
    "2Mac": "2 Maccabees",
    "3Mac": "3 Maccabees",
    "4Mac": "4 Maccabees",
    "AddEsth": "Additions to Esther",
    "Odes": "Odes",
    "Od": "Odes",
    "PsSol": "Psalms of Solomon",
    "Qoh": "Qoheleth",
    "Cant": "Canticles",
}
  
  

function extractTerms(line) {
    let parts = [];
    let currentPart = '';
    let spacedLine = line.replace('\t', ' ');
    
    for(let i = 0; i < spacedLine.length; i++) {
        const char = spacedLine[i];

        if (char === ' ') {
            if (currentPart) {
                parts.push(currentPart);
                currentPart = '';
            }
        } else {
            currentPart += char;
        }
    }

    if (currentPart) {
        parts.push(currentPart);
    }
    // Remove any trailing or leading whitespace
    parts = parts.map(part => part.trim());

    return parts;
}

// Load the input CATSS-format data (all books)

async function processBook(fileName, insertFn) {
    // filePath: '../data/catss-data/01.Gen.1.mlxx'
    const input = fs.readFileSync(`../data/catss-data/lxxmorph/${fileName}`, 'utf8');
    const lines = input.split(/\r?\n/);

    const output = {};
    let currentVerse = null;
    let chapter = null;
    let verse = null;
    let bookName = null;

    for (const line of lines) {
        if (!line.trim()) continue;

        // Match any book + verse (e.g. "Gen 2:15", "Exod 1:1", etc.)
        // const verseMatch = line.match(/^([A-Za-z]+)\s+(\d+:\d+)/);
        // const verseMatch = line.match(/^([\d]?[A-Za-z]+(?:\/[A-Za-z]+)?)\s+(\d+:\d+)/);
        const verseMatch = line.match(/^([\d]?(?:\/[\d])?[A-Za-z]+(?:\/[A-Za-z]+)?)\s+(\d+:\d+)/);
        
        if (verseMatch) {
            const [_, book, chapterVerse] = verseMatch;
            const bookLower = book // book.toLowerCase();
            const fullBookName = bookNameMap[bookLower] || bookLower.charAt(0).toUpperCase() + bookLower.slice(1);
            const [chapterNumber, verseNumber] = chapterVerse.split(':');
            // console.log({
            //     fullBookName,
            //     chapterNumber,
            //     verseNumber,
            // })
            bookName = fullBookName;
            chapter = parseInt(chapterNumber);
            verse = parseInt(verseNumber);

            currentVerse = `${book} ${chapterVerse}`;
            output[currentVerse] = [];
            continue;
        }

        // Parse normal data line
        const parts = extractTerms(line) // line.split('\t');

        if (parts.length < 3 || !currentVerse) {
            console.warn(`Skipping malformed line: ${line}`);
            throw new Error(`Malformed line: ${line}`)
            // continue;
        }

        if(parts.length === 3) {
            const [word, morph1, lemma] = parts;
            const d = {
            word: word.trim(),
            morph: morph1.trim(),
            lemma: lemma.trim(),
            greekLemma: betaCodeToGreek(lemma.trim()),
            greekWord: betaCodeToGreek(word.trim()),
            morphology: parseLXXMorphCode(morph1.trim())
            }
            output[currentVerse].push(d);
            if(insertFn) {
                await insertFn(d, bookName, chapter, verse);
            }
        } else if(parts.length === 4) {
            const [word, morph1, morph2, lemma] = parts;
            const d = {
            word: word.trim(),
            morph: morph1.trim() + morph2.trim(),
            lemma: lemma.trim(),
            greekLemma: betaCodeToGreek(lemma.trim()),
            greekWord: betaCodeToGreek(word.trim()),
            morphology: parseLXXMorphCode(morph1.trim() + "-" + morph2.trim())
            }
            output[currentVerse].push(d);
            if(insertFn) {
                await insertFn(d, bookName, chapter, verse);
            }
        } else if(parts.length === 5) {
            const [word, morph1, morph2, lemma, prefix] = parts;
            const d = {
                word: word.trim(),
                morph: morph1.trim() + morph2.trim(),
                lemma: lemma.trim(),
                prefix: prefix.trim(),
                greekPrefix: betaCodeToGreek(prefix.trim()),
                greekLemma: betaCodeToGreek(lemma.trim()),
                greekWord: betaCodeToGreek(word.trim()),
                morphology: parseLXXMorphCode(morph1.trim() + "-" + morph2.trim())
                }
            output[currentVerse].push(d);
            if(insertFn) {
                await insertFn(d, bookName, chapter, verse);
            }
        } else if(parts.length === 6) {
            const [word, morph1, morph2, lemma, prefix1, prefix2] = parts;
            const d = {
                word: word.trim(),
                morph: morph1.trim() + morph2.trim(),
                lemma: lemma.trim(),
                prefix: prefix1.trim() + "-" + prefix2.trim(),
                greekPrefix: betaCodeToGreek(prefix1.trim()) + "-" +betaCodeToGreek(prefix2.trim()),
                greekLemma: betaCodeToGreek(lemma.trim()),
                greekWord: betaCodeToGreek(word.trim()),
                morphology: parseLXXMorphCode(morph1.trim() + "-" + morph2.trim())
                }
            output[currentVerse].push(d);
            if(insertFn) {
                await insertFn(d, bookName, chapter, verse);
            }
        } else if(parts.length === 7) {
            const [word, morph1, morph2, lemma, prefix1, prefix2, prefix3] = parts;
            const d = {
                word: word.trim(),
                morph: morph1.trim() + morph2.trim(),
                lemma: lemma.trim(),
                prefix: prefix1.trim() + "-" + prefix2.trim() + "-" + prefix3.trim(),
                greekPrefix: betaCodeToGreek(prefix1.trim()) + "-" +betaCodeToGreek(prefix2.trim()) + "-" + betaCodeToGreek(prefix3.trim()),
                greekLemma: betaCodeToGreek(lemma.trim()),
                greekWord: betaCodeToGreek(word.trim()),
                morphology: parseLXXMorphCode(morph1.trim() + "-" + morph2.trim())
                }
            output[currentVerse].push(d);
            if(insertFn) {
                await insertFn(d, bookName, chapter, verse);
            }
        }
        else {
            console.warn(`Skipping unrecognized line: ${line}`);
            throw new Error('Invalid line')
        }
    }

    // Write to JSON
    // fs.writeFileSync(`../data/catss-data/json/${fileName}.json`, JSON.stringify(output, null, 2), 'utf8');
    console.log('✅ Done! Output written to ${fileName}.json');
}

async function processAllBooks(insertFn) {
    const files = fs.readdirSync('../data/catss-data/lxxmorph').filter(file => file.endsWith('.mlxx'));
    console.log(`Found ${files.length} files.`);
    let i = 0;
    let j = 0;
    for (const file of files) {
        console.log(`Processing (${i}) ${file}...`);
        if(i < j) {
            i++;
            continue;
        }

        await processBook(file, insertFn);
        i++;
    }
    console.log('All files processed successfully.');
    // for (const file of files) {
    //     // `../data/catss-data/${file}`
    //     await processBook(file);
    // }
}
// processBook('../data/catss-data/01.Gen.1.mlxx');

//processAllBooks();

// processBook('25.2Macc.mlxx');


const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../data/database/lxx_morph.db');

db.serialize(async () => {
  db.run(`DROP TABLE IF EXISTS lxx_morphology`);
  db.run(`
    CREATE TABLE lxx_morphology (
      id INTEGER PRIMARY KEY,
      beta_code_lemma TEXT,
      beta_code_word TEXT,
      morph_code TEXT,
      greek_word TEXT,
      lemma TEXT,
      part_of_speech TEXT,
      tense TEXT NULL,
      voice TEXT NULL,
      mood TEXT NULL,
      person TEXT NULL,
      number TEXT NULL,
      stem_type TEXT NULL,
      declension TEXT NULL,
      "case" TEXT NULL,
      gender TEXT NULL,
      prefix TEXT NULL,
      meta_data JSONB,
      book_name TEXT,
      chapter TEXT,
      verse TEXT
    )
  `);

  const insertQuery = `
    INSERT INTO lxx_morphology (
        beta_code_lemma,
        beta_code_word,
        morph_code,
        greek_word,
        lemma,
        part_of_speech,
        tense,
        voice,
        mood,
        person,
        "number",
        stem_type,
        declension,
        "case",
        gender,
        prefix,
        meta_data,
        book_name,
        chapter,
        verse
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const data = [
    'lemma_beta_code', // beta_code_lemma
    'word_beta_code',  // beta_code_word
    'morph_code',      // morph_code
    'λόγος',           // greek_word
    'logos',           // lemma
    'noun',            // part_of_speech
    'present',         // tense
    'active',          // voice
    null,              // mood
    null,              // person
    'singular',        // number
    null,              // stem_type
    null,              // declension
    'nominative',      // case
    'masculine',       // gender
    null,              // prefix
    JSON.stringify({ source: 'LXX' }) // meta_data
    ];

    const insertData = (bookData, bookName, chapter, verse) => {
        // const d = {
        //     "word": "PAROIKH=SAI",
        //     "morph": "VAAAN",
        //     "lemma": "OI)KE/W",
        //     "prefix": "PARA",
        //     "greekPrefix": "παρα",
        //     "greekLemma": "οἰκέω",
        //     "greekWord": "παροικῆσαι",
        //     "morphology": {
        //       "raw": "VA-AAN",
        //       "partOfSpeech": "Verb",
        //       "stemType": "1st-aorist-active",
        //       "augmented": false,
        //       "tense": "Aorist",
        //       "voice": "Active",
        //       "mood": "Infinitive"
        //     }
        //   };

        const data = [
            bookData.lemma, // beta_code_lemma
            bookData.word,  // beta_code_word
            bookData.morphology.raw,      // morph_code
            bookData.greekWord,           // greek_word
            bookData.greekLemma,           // lemma
            bookData.morphology.partOfSpeech,            // part_of_speech
            bookData.morphology.tense,         // tense
            bookData.morphology.voice,          // voice
            bookData.morphology.mood,              // mood
            bookData.morphology.person,              // person
            bookData.morphology.number,        // number
            bookData.morphology.stemType,              // stem_type
            bookData.morphology.declension,              // declension
            bookData.morphology.case,      // case
            bookData.morphology.gender,       // gender
            bookData.morphology.greekPrefix,              // prefix
            JSON.stringify(bookData), // meta_data
            bookName,
            chapter,
            verse
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

    await processAllBooks(insertData);


    // Add indexes for fast lookups
    db.run(`CREATE INDEX idx_beta_code_lemma ON lxx_morphology(beta_code_lemma)`);
    db.run(`CREATE INDEX idx_beta_code_word ON lxx_morphology(beta_code_word)`);
    db.run(`CREATE INDEX idx_morph_code ON lxx_morphology(morph_code)`);
    db.run(`CREATE INDEX idx_greek_word ON lxx_morphology(greek_word)`);
    db.run(`CREATE INDEX idx_part_of_speech ON lxx_morphology(part_of_speech)`);
    db.run(`CREATE INDEX idx_tense_voice_mood ON lxx_morphology(tense, voice, mood)`);

    db.close();

  console.log("✅ Database created and populated.");
});


