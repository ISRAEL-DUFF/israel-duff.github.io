const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// const LSJ_DIR = path.join(__dirname, 'lsj');
const LSJ_DIR = `/Users/israel-duff/Desktop/logosvocab/LSJ_GreekUnicode-master`;
const INDEX_FILE = path.join(__dirname, 'lsj-index.json');

async function buildLsjIndex() {
  const index = {};
    //   const files = getAllXmlFiles(LSJ_DIR);
    const files = fs.readdirSync(LSJ_DIR)
    .filter(f => f.endsWith('.xml'))
    .map(f => path.join(LSJ_DIR, f));

    console.log(`✅ Found ${files.length} XML files.`);


  for (const file of files) {
    const xml = fs.readFileSync(file, 'utf8');
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const entries = parsed?.TEI?.text?.body?.entry;
    const entryList = Array.isArray(entries) ? entries : [entries];

    for (const entry of entryList) {
      const lemma = entry?.form?.orth?.["_"] || entry?.form?.orth;
      if (lemma) index[lemma] = file;
    }
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
  console.log(`✅ LSJ index written to ${INDEX_FILE}`);
}

function getAllXmlFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllXmlFiles(fullPath));
    } else if (file.endsWith('.xml')) {
      files.push(fullPath);
    }
  });
  return files;
}

buildLsjIndex();
