const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { betaCodeToGreek } = require('beta-code-js');


function convertCsvToJson(filePath) {
  const input = fs.readFileSync(filePath, 'utf8');

  const records = parse(input, {
    columns: true,
    skip_empty_lines: true,
    delimiter: '\t',
    quote: '"',
    trim: true
  });

  return records;
}

// Example usage:
const jsonData = convertCsvToJson('./data/dodson.csv'); // replace with your filename

const giantDodson = {}

const greekWords = jsonData.map(word => {
    const convertedWord = betaCodeToGreek(word["Greek Word"])
    const extractedWord = convertedWord.split(",")[0]

    const mappedData = {
        ...word,
        greekWord: betaCodeToGreek(word["Greek Word"]),
        "Greek Word": undefined,
        "Beta Code": word["Greek Word"]
    };

    giantDodson[extractedWord] = mappedData
    return mappedData
})

fs.writeFileSync('./data/dodson.json', JSON.stringify(greekWords, null, 2), 'utf8');
fs.writeFileSync('./data/dodson-dictionary.json', JSON.stringify(giantDodson, null, 2), 'utf8');

console.log('✅ Converted CSV to JSON successfully!');
