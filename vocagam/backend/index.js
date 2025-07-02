const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

// Erasmian pronunciation dictionary
const erasmianIpaMap = {
    "λόγος": "LOH-gohs",
    "ἀγάπη": "ah-GAH-pay",
    "χάρις": "KHAH-ris",
    "πνεῦμα": "PNEV-mah",
    "θεός": "theh-OSS"
};

// IPA dictionary
const ipaDict = {
    'λόγος': { koine: '/ˈlo.ɣos/', attic: '/ló.ɡos/', erasmian: '/ˈloɡ.os/' },
    'ἀγάπη': { koine: '/a.ˈɣa.pe/', attic: '/a.ˈɡá.pɛː/', erasmian: '/a.ˈɡa.peɪ/' },
    'χάρις': { koine: '/ˈxa.ris/', attic: '/ˈkʰá.ris/', erasmian: '/ˈkʰa.ris/' },
    'πνεῦμα': { koine: '/ˈpnev.ma/', attic: '/pneû̯.ma/', erasmian: '/ˈpnev.ma/' },
    'θεός': { koine: '/θe.ˈos/', attic: '/tʰe.ˈós/', erasmian: '/θe.ˈos/' }
};

// IPA mapping rules
const IPA_MAP = [
    ['αι', 'ai̯'],
    ['ει', 'ei̯'],
    ['οι', 'oi̯'],
    ['ου', 'u'],
    ['υι', 'yi̯'],
    ['α', 'a'],
    ['β', 'b'],
    ['γ', 'ɣ'],
    ['δ', 'd'],
    ['ε', 'e'],
    ['ζ', 'zd'],
    ['η', 'ɛː'],
    ['θ', 'tʰ'],
    ['ι', 'i'],
    ['κ', 'k'],
    ['λ', 'l'],
    ['μ', 'm'],
    ['ν', 'n'],
    ['ξ', 'ks'],
    ['ο', 'o'],
    ['π', 'p'],
    ['ρ', 'r'],
    ['σ', 's'],
    ['ς', 's'],
    ['τ', 't'],
    ['υ', 'y'],
    ['φ', 'pʰ'],
    ['χ', 'kʰ'],
    ['ψ', 'ps'],
    ['ω', 'ɔː']
];

const IPA_TO_ESPEAK_MAP = {
    // Vowels
    "a": "a", "e": "e", "eː": "e:", "i": "i", "o": "o", "ɔː": "O:",
    "u": "u", "y": "y",
  
    // Stops
    "p": "p", "b": "b", "t": "t", "d": "d", "k": "k", "g": "g",
  
    // Aspirated stops
    "pʰ": "p_h", "tʰ": "t_h", "kʰ": "k_h",
  
    // Fricatives
    "s": "s", "z": "z",
  
    // Nasals
    "m": "m", "n": "n", "ŋ": "N",
  
    // Affricates and clusters
    "ks": "k s", "ps": "p s", "dz": "d z", "ŋg": "N g", "ŋk": "N k", "ŋks": "N k s",
  
    // Liquids
    "r": "r", "l": "l",
  
    // Diphthongs (mapped to sequences)
    "ai": "a i", "ei": "e i", "oi": "o i", "au": "a u", "eu": "e u", "ou": "u",
  };
  

function greekToIpa(word, style = 'koine') {
    let text = word.toLowerCase();
    text = text.replace(/[῾᾽'᾿]/g, '');  // remove rough/smooth breathing
    text = text.replace(/[̀͂́̈]/g, '');   // strip accent/diacritics

    for (const [pattern, ipa] of IPA_MAP) {
        text = text.replace(new RegExp(pattern, 'g'), ipa);
    }

    return text;
}

function ipaToEspeakPhonemes(ipa) {
    let output = ipa;
  
    // Longer matches first to avoid partial replacements (e.g., "pʰ" before "p")
    const keys = Object.keys(IPA_TO_ESPEAK_MAP).sort((a, b) => b.length - a.length);
  
    for (const ipaSound of keys) {
      const espeakPhoneme = IPA_TO_ESPEAK_MAP[ipaSound];
      const regex = new RegExp(ipaSound.replace(/[ː]/g, "\\ː"), 'g');
      output = output.replace(regex, espeakPhoneme);
    }
  
    // Replace stress mark
    output = output.replace(/ˈ/, "'");
  
    return output;
}
  

app.get('/greek-pronounce', (req, res) => {
    const word = req.query.word || '';
    const style = req.query.style || 'koine';

    if (!word) {
        return res.status(400).send('Missing word');
    }

    const filename = path.join('/tmp', `${uuidv4()}.wav`);

    let cmd;
    if (style === 'erasmian') {
        // const ipa = erasmianIpaMap[word] || word;
        const ipa = word; // ipaToEspeakPhonemes(word); // TODO: convert word to IPA
        cmd = `espeak-ng -v el --ipa -s 110 -w ${filename} "${ipa}"`;

        console.log(cmd)
    } else {
        const voice = 'grc';  // Classical Greek voice in espeak-ng
        // cmd = `espeak-ng -v ${voice} -s 120 -w ${filename} "${word}"`;

        const ipa = greekToIpa(word, style)
        cmd = `espeak-ng -v ${voice} -s 100 -p 50 -a 100 -g 5 -w ${filename} "${ipa}"`;

        // cmd = `espeak-ng -v ${voice} -s 100 -p 50 -a 100 -g 5 -w ${filename} "${word}"`;

        // Pre-process the word to handle diacritics
        // const processedWord = word
        //     .replace(/[῾᾽'᾿]/g, '')  // remove breathing marks
        //     .replace(/[̀͂́̈]/g, '');   // remove accents
        // cmd = `espeak-ng -v ${voice} -s 100 -p 50 -a 100 -g 5 -w ${filename} "${processedWord}"`;
    }

    exec(cmd, (error) => {
        if (error) {
            console.log(error)
            return res.status(500).send('Error generating audio');
        }

        res.sendFile(filename, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Clean up the file
            fs.unlink(filename, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
        });
    });
});

app.get('/ipa-lookup', (req, res) => {
    const word = req.query.word || '';
    const style = req.query.style || 'koine';

    const ipa = ipaDict[word]?.[style] || null;

    res.json({ word, style, ipa });
});

app.get('/ipa-lookup/dynamic', (req, res) => {
    const word = req.query.word || '';
    const style = req.query.style || 'koine';
    const ipa = greekToIpa(word, style);
    res.json({ ipa });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});