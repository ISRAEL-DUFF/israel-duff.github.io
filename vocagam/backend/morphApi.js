const express = require("express");
const cors = require('cors'); // Import the CORS middleware
const path = require("path");
const { 
    createMorphologyEntry, 
    getMorphologyEntry, 
    updateMorphologyEntry, 
    deleteMorphologyEntry,
    getAllMorphologyData,
    listAllVocabsInfo,
    fetchGreekMorphs,
} = require('./morphologyService');
const { fetchLexiconEntryWithMorphData } = require('./lexiconService')
const { lookupHeadwordByGreek } = require("./lsj-lookup");

const startedAt = new Date().toISOString();

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());


app.get('/ping', (req, res) => {
  res.status(200).send('🟢 Glitch app is awake and responding!');
});

app.get('/status', (req, res) => {
  res.json({
    status: '🟢 running',
    startedAt,
    now: new Date().toISOString()
  });
});

app.get('/vocab/info', (req, res) => {
  const info = listAllVocabsInfo()
  res.json(info);
});

app.post("/vocab/add", async function (request, reply) {
  
  // If the user submitted a color through the form it'll be passed here in the request body
  let vocab = request.body;
  const {vocabKey, word, morphData, meanings, lexicalData, notes} = vocab;
  
  if(!word) {
    return reply.send({
      success: false,
      message: 'Original word must be supplied'
    })
  }
  
  if(!vocabKey) {
    return reply.send({
      success: false,
      message: 'VocabKey is missing'
    })
  }
  
  if(!morphData) {
    console.log(morphData)
    return reply.send({
      success: false,
      message: 'Morph Data must be an array'
    })
  }
  
  if(!morphData[0]) {
    return reply.send({
      success: false,
      message: 'Morph Data array must not be empty'
    })
  }
  
  if(!meanings || meanings.length === 0) {
    return reply.send({
      success: false,
      message: 'Meaning array missing'
    })
  }
  
  const wordExists = await getMorphologyEntry(vocabKey, morphData[0].lemma)
  if(wordExists) {
    return reply.send({
      success: false,
      message: 'Word already exist for the key'
    });
  }
  
  const entry = await createMorphologyEntry({key: vocabKey, headWord: morphData[0].lemma, word, morphData, meanings, lexicalData, notes})
  
  reply.send(entry)
    
});


app.put("/vocab/update", async function (request, reply) {
  
  // If the user submitted a color through the form it'll be passed here in the request body
  let vocab = request.body;
  const {vocabKey, word, morphData, meanings} = vocab;
  
  if(!word) {
    return reply.send({
      success: false,
      message: 'Original word must be supplied'
    })
  }
  
  if(!vocabKey) {
    return reply.send({
      success: false,
      message: 'VocabKey is missing'
    })
  }
  
  if(morphData && !morphData[0]) {
    console.log(morphData)
    return reply.send({
      success: false,
      message: 'Morph Data must be an array'
    })
  }

  
  if(meanings && meanings.length === 0) {
    return reply.send({
      success: false,
      message: 'Meaning array missing items'
    })
  }
  
  const entry = await updateMorphologyEntry({key: vocabKey, word, newMorphData: morphData, newMeanings:meanings})
  
  reply.send({
    success: true,
    data: entry
  })
    
});

app.get("/vocab/list/:key", async function (request, reply) {
  
  // If the user submitted a color through the form it'll be passed here in the request body
  let vocabKey = request.params['key'];
  
  if(!vocabKey) {
    return reply.send({
      success: false,
      message: 'VocabKey is missing'
    })
  }
  
  
  const entries = await getAllMorphologyData (vocabKey)
  
  reply.send(entries)
    
});

app.delete("/vocab/delete/:key", async function (request, reply) {
  
  // If the user submitted a color through the form it'll be passed here in the request body
  let vocabKey = request.params['key'];
  let vocab = request.body;
  const { id } = vocab;
  
  if(!vocabKey) {
    return reply.send({
      success: false,
      message: 'VocabKey is missing'
    })
  }
  
  if(!id) {
    return reply.send({
      success: false,
      message: 'Id is missing'
    })
  }
  
  
  const entries = await deleteMorphologyEntry(vocabKey, id)
  
  reply.send(entries)
    
});


app.get("/morphology", async (req, res) => {
    const filters = req.query;
    if (!filters) return res.status(400).json({ error: "Missing 'filter' parameter" });

    const filtrs = JSON.parse(JSON.stringify(filters))
    console.log(filtrs)
  
    try {
      const morphs = await fetchGreekMorphs(filtrs)
  
      return res.send(morphs);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch analysis", details: error.message });
    }
});

app.get("/lexica/:word", async (req, res) => {
    const word = req.params.word;
    if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });
  
    try {
        const responseData = await fetchLexiconEntryWithMorphData(word);
      
      return res.send(responseData);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch analysis", details: error.message });;
    }
});

app.listen(PORT, () => {
  console.log(`Greek Morphology server listening at http://localhost:${PORT}`);
});
