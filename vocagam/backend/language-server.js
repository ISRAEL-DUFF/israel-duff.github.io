const express = require("express");
const cors = require('cors'); // Import the CORS middleware
const path = require('path');
const { greekApiRoutes } = require("./greek/api");
const { hebrewApiRoutes } =  require('./hebrew/api')
const { latinApiRoutes } = require('./latin/api')
const { storyApiRoutes } = require('./story-creator/api');

const startedAt = new Date().toISOString();

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '50mb'}));

// Static file serving for uploaded assets
app.use('/assets', express.static(path.join(__dirname, process.env.STORAGE_PATH || 'uploads')));

const PORT = 3001;

// // Mount the Greek router
app.use('/greek', greekApiRoutes);

// Mount the Hebrew router
app.use('/hebrew', hebrewApiRoutes);

// Mount the Hebrew router
app.use('/latin', latinApiRoutes);

// Mount the story router
app.use('/stories', storyApiRoutes)

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
