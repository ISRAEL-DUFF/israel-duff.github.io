const express = require("express");
const cors = require('cors'); // Import the CORS middleware
const { greekApiRoutes } = require("./greek/api");
const { hebrewApiRoutes } =  require('./hebrew/api')
const { latinApiRoutes } = require('./latin/api')

const startedAt = new Date().toISOString();

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb'}));

const PORT = 3001;

// // Mount the Greek router
app.use('/greek', greekApiRoutes);

// Mount the Hebrew router
app.use('/hebrew', hebrewApiRoutes);

// Mount the Hebrew router
app.use('/latin', latinApiRoutes);

app.get('/ping', (req, res) => {
  res.status(200).send('🟢 Language server is alive and responding!');
});

app.get('/status', (req, res) => {
  res.json({
    status: '🟢 running',
    startedAt,
    now: new Date().toISOString()
  });
});

app.listen(PORT, (e) => {
    if(e) {
        console.log("Error:", e)
    }
  console.log(`Language server listening at http://localhost:${PORT}`);
})
