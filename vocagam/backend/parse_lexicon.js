const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");

// Load XML content
const xmlData = fs.readFileSync("./data/partial_lsj.xml", "utf8");

// Setup XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  preserveOrder: false,
  allowBooleanAttributes: true,
  trimValues: true,
});

// Parse the XML into JS object
const parsed = parser.parse(xmlData);

// fs.writeFileSync("./data/lsj_output.json", JSON.stringify(parsed, null, 2), "utf8");


// Traverse into the correct path
const entries = parsed['div2']; // parsed.TEI.text.body.div1.div2;
// fs.writeFileSync("./data/lsj_output.json", JSON.stringify(entries, null, 2), "utf8");

// Function to normalize a field (returning string or null)
const getText = (field) =>
  Array.isArray(field)
    ? field.map(f => typeof f === 'string' ? f : f['#text'] || '').join('; ')
    : typeof field === 'string'
    ? field
    : field?.['#text'] || null;

const results = entries.map(entry => {
  const headword = getText(entry.head);
  const itype = getText(entry.itype);
  const etym = getText(entry.etym);
  const senses = [];

  if (Array.isArray(entry.sense)) {
    entry.sense.forEach(s => {
      if (typeof s === 'string') {
        senses.push({ definition: s });
      } else if (typeof s === 'object') {
        const def = s.i || s;
        const definition = getText(def);
        senses.push({ id: s['@_id'] || null, definition });
      }
    });
  }

  return {
    key: entry['@_key'],
    headword,
    type: entry['@_type'],
    itype,
    etymology: etym,
    senses,
  };
});

// Save to JSON file
fs.writeFileSync("lsj_output-2.json", JSON.stringify(results, null, 2), "utf8");

console.log(`✅ Extracted ${results.length} entries to lsj_output.json`);
