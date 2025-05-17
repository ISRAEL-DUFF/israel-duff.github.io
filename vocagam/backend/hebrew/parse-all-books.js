const fs = require('fs');
const path = require('path');

const wlcPath = path.join(__dirname, '../data/morphhb-master/hebrew.json'); // Directory with all XML files
const Jsonfile = fs.readdirSync(wlcPath);

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

let allWords = [];
let totalVerses = 0;

function extractWordData(w, book, chapter, verseNum) {
    const word = w['#text'] || '';
    const lemma = w['lemma'] || '';
    const morph = w['morph'] || '';
    const id = w['id'] || '';

    return {
        wordId: id,
        book,
        chapter: parseInt(chapter),
        verse: parseInt(verseNum),
        word,
        lemma,
        morph
      }
}

const allBooks = JSON.parse(fs.readFileSync(wlcPath, 'utf8'));

for (const book in allBooks) {
  const chapters = allBooks[book];

  for(let chaptNum = 0; chaptNum < chapters.length; chaptNum++) {
    //
    const verseList = chapters[chaptNum];

    for(let versNum = 0; versNum < verseList.length; versNum++) {
        const wordList = verseList[versNum];
        let w = {
          book
        }

        for(let wordNum = 0; wordNum < wordList.length; wordNum++) {
          const element = wordList[wordNum];
          if (hebrewWordPattern.test(element)) {
            w.word = element;
          } else if (strongNumberPattern.test(element)) {
            result.strongNumber = element;
          } else if (morphCodePattern.test(element)) {
            w.morph = element;
          }

            allWords.push({
                wordId: id,
                book,
                chapter: chaptNum + 1,
                verse: versNum + 1,
                word,
                lemma,
                morph
              })
        }
    }
  }

//   if(!data.osis) {
//     console.log(`❌ No OSIS data found in ${file}`);
//     continue;
//   }
//   if (!data.osis.osisText) {
//     console.log(`❌ No OSIS text found in ${file}`);
//     continue;
//   }
//   if (!data.osis.osisText.div) {
//     console.log(`❌ No OSIS div found in ${file}`);
//     continue;
//   }

  const bookData = data.osis.osisText.div;
  const bookId = bookData.book?.osisID || file.replace('.xml', '');
  const verses = file !== 'Obad.xml' ? bookData.chapter : bookData.chapter?.verse;

//   console.log({
//     verses: bookData.chapter?.length,
//     checkVerses: !bookData.chapter?.length ? bookData : true,
//     file
//   });


  const verseList = asArray(verses);
  totalVerses += verseList.length;
  console.log(`📖 Parsing ${bookId} (${file}) with ${verseList.length} verses`);

  for (const verse of verseList) {
    const osisID = verse.osisID;
    if (!osisID) {
        continue
    };

    const [book, chapter, verseNum] = osisID.split('.');

    const words = asArray(verse.w ?? verse.verse);
    if (!words.length) {
        // console.log(`❌ No words found in ${osisID}`, JSON.stringify(verse));
        console.log(`❌ No words found in ${osisID}`);
        // continue;
      // throw new Error("check")
    }

    for (const ww of words) {   
        // console.log(`- ${JSON.stringify(ww)}`);

        // throw new Error('Cneck')

      if(!ww.w?.length) {
        allWords.push(extractWordData(ww, book, chapter, verseNum));
      } else {
        for(const w of asArray(ww.w)) {
            // console.log({
            //     w, book, chapter, verseNum,
            //     osisID: ww.osisID,
            // })
            // throw Error('Chek')

          const [book, chapter, verseNum] = ww.osisID.split('.');
          allWords.push(extractWordData(w, book, chapter, verseNum));
        }
      }
    }
  }
}

fs.writeFileSync('parsed_ot.json', JSON.stringify(allWords, null, 2), 'utf8');
console.log(`✅ Parsed ${allWords.length} words from ${files.length} books. total number of verses: ${totalVerses}`);
console.log(`✅ Total words: ${allWords.length}`);
console.log(`✅ Total verses: ${totalVerses}`);
console.log(`✅ Total books: ${files.length}`);
