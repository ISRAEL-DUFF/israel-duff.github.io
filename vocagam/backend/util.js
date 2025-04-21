const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const INDEX_PATH = path.join(__dirname, 'lsj-index.json');

async function getGlossesFromSplitFiles(lemma) {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const file = index[lemma];
  if (!file) return [];

  const xml = fs.readFileSync(file, 'utf8');
  const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

  const entries = parsed?.TEI?.text?.body?.entry;
  const entryList = Array.isArray(entries) ? entries : [entries];

  const target = entryList.find(e => {
    const orth = e?.form?.orth?.["_"] || e?.form?.orth;
    return orth === lemma;
  });

  if (!target) return [];

  const defs = target?.sense?.def;
  if (!defs) return [];

  return Array.isArray(defs)
    ? defs.map(d => (typeof d === 'string' ? d : d["_"])).filter(Boolean)
    : [typeof defs === 'string' ? defs : defs["_"]];
}

module.exports = { getGlossesFromSplitFiles };
