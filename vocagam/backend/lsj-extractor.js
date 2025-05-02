const fs = require('fs');
const xml2js = require('xml2js');

// Function to parse the XML and extract the data
function parseLSJXML(filePath) {
    const parser = new xml2js.Parser();

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading the file:", err);
            return;
        }

        // Parse the XML data
        parser.parseString(data, (err, result) => {
            if (err) {
                console.error("Error parsing XML:", err);
                return;
            }

            // Process and extract the required information
            const entries = result['div2'].map(entry => {
                return extractEntry(entry);
            });

            // Output the formatted JSON
            console.log(JSON.stringify(entries, null, 2));
        });
    });
}

// Function to extract relevant data from a 'div2' element
async function extractEntry(entryXml) {
    const parser = new xml2js.Parser();

    const entry = await parser.parseStringPromise(entryXml);

    // Extract basic information like word (headword), references, and senses
    const headword = entry.div2.head[0];
    const references = extractReferences(entry.div2.bibl);
    const senses = extractSenses(entry.div2.sense);

    return {
        headword,
        references,
        senses
    };
}

// Function to extract references (bibl elements)
function extractReferences(biblElements) {
    console.log("biblElements", biblElements);
    return biblElements.map(bibl => {
        const title = bibl.title ? bibl.title[0] : null;
        const author = bibl.author ? bibl.author[0] : null;
        const n = bibl.$.n;
        return { title, author, n };
    });
}

// Function to extract senses (sense elements)
function extractSenses(senseElements) {
    return senseElements.map(sense => {
        const level = sense.$.level;
        const description = sense.i ? sense.i[0] : null;
        const quote = sense.cit ? extractQuotes(sense.cit) : null;
        return { level, description, quote };
    });
}

// Function to extract quotes from cit elements
function extractQuotes(citElements) {
    return citElements.map(cit => {
        const quoteText = cit.quote ? cit.quote[0] : null;
        return { quoteText };
    });
}

// Path to the XML file
// const filePath = 'path/to/your/file.xml';

// Run the parser on the XML file
// parseLSJXML(filePath);

module.exports = {
    extractEntry: extractEntry,
}