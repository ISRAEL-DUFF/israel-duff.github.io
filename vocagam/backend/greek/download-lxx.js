process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

// Base URL
const baseUrl = 'https://ccat.sas.upenn.edu/gopher/text/religion/biblical/lxxmorph/';

// Target directory to save files
const outputDir = path.join(__dirname, '../data/catss-data/lxxmorph');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Download a single file
function downloadFile(filename) {
  const fileUrl = baseUrl + filename;
  const dest = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    https.get(fileUrl, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${fileUrl}' (${res.statusCode})`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
    }).on('error', reject);
  });
}

// Fetch and parse directory listing
async function fetchFileList() {
  return new Promise((resolve, reject) => {
    https.get(baseUrl, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const dom = new JSDOM(data);
        const links = [...dom.window.document.querySelectorAll('a')]
          .map(a => a.href)
          .filter(href =>
            href &&
            !href.endsWith('/') &&
            !href.startsWith('?') &&
            !href.startsWith('..')
          );
        resolve(links);
      });
    }).on('error', reject);
  });
}

// Main download function
async function downloadAll() {
  try {
    const fileList = await fetchFileList();
    console.log(`Found ${fileList.length} files.`);
    for (const file of fileList) {
      console.log(`Downloading ${file}...`);
      await downloadFile(file);
    }
    console.log('All files downloaded successfully.');
  } catch (err) {
    console.error('Error:', err);
  }
}

downloadAll();
