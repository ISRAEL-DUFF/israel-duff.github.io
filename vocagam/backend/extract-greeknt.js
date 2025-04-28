// // Load libraries
// const fs = require('fs');
// const { BetaCode } = require('betacode');
// const { parseStringPromise } = require('xml2js');

// // Initialize BetaCode converter
// const betaCode = new BetaCode();

// // Read the XML file
// async function processGreekText() {
//   try {
//     const xmlData = fs.readFileSync('./data/Perseus_greek_nt_text.xml', 'utf8');

//     // Preprocess: remove milestone tags, we only care about text
//     const textWithoutMilestones = xmlData.replace(/<milestone[^>]+>/g, '\n');

//     // Optional: remove any other XML tags if needed
//     const cleanText = textWithoutMilestones.replace(/<[^>]+>/g, '');

//     // Split text into words
//     const wordsBeta = cleanText
//       .split(/\s+/)            // split by whitespace
//       .filter(word => word.length > 0); // remove empty words

//     // Convert each Beta Code word to Unicode
//     const wordsUnicode = wordsBeta.map(word => {
//       try {
//         return betaCode.decode(word);
//       } catch (err) {
//         console.error('Conversion error for word:', word);
//         return null;
//       }
//     }).filter(word => word !== null);

//     // Save to JSON
//     fs.writeFileSync('./data/greek_nt_words.json', JSON.stringify(wordsUnicode, null, 2), 'utf8');

//     console.log(`✅ Successfully extracted ${wordsUnicode.length} Greek words!`);
//     console.log(`📄 Output saved to greek_words.json`);

//   } catch (err) {
//     console.error('❌ Error:', err);
//   }
// }

// // Run the function
// processGreekText();


const fs = require('fs');
// const betacode = require('betacode'); // <--- ✅ Use official BetaCode lib
// const { betaToGreek } = require('greek-utils');
// import { greekToBetaCode, betaCodeToGreek } from 'beta-code-js';
const { betaCodeToGreek } = require('beta-code-js');



// 1. Read the XML file
const xml = fs.readFileSync('./data/Perseus_greek_nt_text.xml', 'utf8');

// 2. Extract only <text>...</text> part
const textMatch = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/i);

if (!textMatch) {
    console.error("No <text> section found.");
    process.exit(1);
}

const textSection = textMatch[1];

// 3. Remove all XML tags inside <text>
const cleanText = textSection.replace(/<[^>]+>/g, '');

// 4. Split by spaces into Beta Code words
const betaWords = cleanText.split(/\s+/).filter(w => w.trim() !== '');

// 5. Convert each Beta Code word to Unicode Greek
let i = 0;
const totalWordCount = betaWords.length;
const greekWords = betaWords.map(word => {
    i += 1;
    console.log(`${i}/${totalWordCount}`)
    return betaCodeToGreek(word)
});

// 6. Output to JSON
fs.writeFileSync('./data/greet_nt_words.json', JSON.stringify(greekWords, null, 2), 'utf8');

console.log('Finished extracting words.');

