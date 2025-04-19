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

function greekToIpa(word, style = 'koine') {
    let text = word.toLowerCase();
    text = text.replace(/[῾᾽'᾿]/g, '');  // remove rough/smooth breathing
    text = text.replace(/[̀͂́̈]/g, '');   // strip accent/diacritics

    for (const [pattern, ipa] of IPA_MAP) {
        text = text.replace(new RegExp(pattern, 'g'), ipa);
    }

    return text;
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
        const ipa = erasmianIpaMap[word] || word;
        cmd = `espeak-ng -v en -s 120 -w ${filename} "${ipa}"`;
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