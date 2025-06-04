const express = require('express');
const app = express.Router();
const { fetchLexiconEntriesAndMorphology, searchMorphologyByCode } = require('./hebrew.service')

// app.use(express.static('public'));
// app.use(express.json());

app.post('/search', async (req, res) => {
  const { word } = req.body;

  if(!word) {
    return res.status(400).json({ error: 'Missing word' });
  }

  const data = await fetchLexiconEntriesAndMorphology(word)

  res.send(data)
  
});

app.get('/search', async (req, res) => {
    const { word } = req.query;

    console.log(req.query, req.query.word)
  
    if(!word) {
      return res.status(400).json({ error: 'Missing word' });
    }
  
    const data = await fetchLexiconEntriesAndMorphology(word)
  
    res.send(data)
    
});

app.get('/lexicon', (req, res) => {
    const { strongs_number: strongsNumber } = req.query;
    console.log('Received strongsNumber:', strongsNumber);
  
    let query = `SELECT * FROM bdb_lexicon WHERE 1=1`;
    const params = [];
  
    if (strongsNumber) {
      query += ` AND strong_number = ?`;
      params.push(strongsNumber);
    }
  
    console.log('Query:', query);
    console.log('Params:', params);
  
    hebrewLexiconDb.all(query + ` LIMIT 100`, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      console.log('Rows:', rows);
      res.json(rows);
    });
});

app.get('/search-morph', async (req, res) => {
    const morphCode = req.query.code;
    if (!morphCode) {
      return res.status(400).json({ error: 'Missing morph code' });
    }
  
    const morphs = await searchMorphologyByCode(morphCode)
    
    res.json({
      results: morphs
    })
    
});

module.exports = {
    hebrewApiRoutes: app
}

// הַשָּׁמַ֥יִם
