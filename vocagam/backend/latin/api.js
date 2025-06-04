const express = require('express');
const app = express.Router();
const { fetchLexiconEntriesAndMorphology } = require('./latin.service')
const { processWords } = require('./whitaker')

app.get('/lexicon', async (req, res) => {
    const { word } = req.query;

    console.log(req.query, req.query.word)
  
    if(!word) {
      return res.status(400).json({ error: 'Missing word' });
    }
  
    const data = await fetchLexiconEntriesAndMorphology(word)
  
    res.send(data)
    
});

app.get('/whitaker', async (req, res) => {
    const { words } = req.query;

    console.log(req.query, req.query.word)
  
    if(!words) {
      return res.status(400).json({ error: 'Missing words' });
    }
  
    const data = await processWords(words)
  
    res.send({
        processed: data
    })
    
});


module.exports = {
    latinApiRoutes: app
}

// הַשָּׁמַ֥יִם
