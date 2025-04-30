/**
 * This is the main Node.js server script for your project
 * Check out the two endpoints this back-end API provides in fastify.get and fastify.post below
 */

const path = require("path");
const { 
    createMorphologyEntry, 
    getMorphologyEntry, 
    updateMorphologyEntry, 
    deleteMorphologyEntry,
    getAllMorphologyData,
    listAllVocabsInfo,
    fetchGreekMorphs
} = require('./morphologyService');
const { getLogeionData } = require('./logeionService');

const startedAt = new Date().toISOString();

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Enable CORS
fastify.register(require('@fastify/cors'), {
  origin: '*', // or specify your frontend URL like 'https://your-frontend.glitch.me'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
fastify.get("/", function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };

  // If someone clicked the option for a random color it'll be passed in the querystring
  if (request.query.randomize) {
    // We need to load our color data file, pick one at random, and add it to the params
    const colors = require("./src/colors.json");
    const allColors = Object.keys(colors);
    let currentColor = allColors[(allColors.length * Math.random()) << 0];

    // Add the color properties to the params object
    params = {
      color: colors[currentColor],
      colorError: null,
      seo: seo,
    };
  }

  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/index.hbs", params);
});


fastify.get('/ping', (req, res) => {
  res.status(200).send('🟢 Glitch app is awake and responding!');
});

fastify.get('/status', (req, res) => {
  res.send({
    status: '🟢 running',
    startedAt,
    now: new Date().toISOString()
  });
});

fastify.get('/api/vocab/info', (req, res) => {
  const info = listAllVocabsInfo()
  res.send(info);
});

/**
 * Our POST route to handle and react to form submissions
 *
 * Accepts body data indicating the user choice
 */
fastify.post("/", function (request, reply) {
  // Build the params object to pass to the template
  let params = { seo: seo };

  // If the user submitted a color through the form it'll be passed here in the request body
  let color = request.body.color;

  // If it's not empty, let's try to find the color
  if (color) {
    // ADD CODE FROM TODO HERE TO SAVE SUBMITTED FAVORITES

    // Load our color data file
    const colors = require("./src/colors.json");

    // Take our form submission, remove whitespace, and convert to lowercase
    color = color.toLowerCase().replace(/\s/g, "");

    // Now we see if that color is a key in our colors object
    if (colors[color]) {
      // Found one!
      params = {
        color: colors[color],
        colorError: null,
        seo: seo,
      };
    } else {
      // No luck! Return the user value as the error property
      params = {
        colorError: request.body.color,
        seo: seo,
      };
    }
  }

  // The Handlebars template will use the parameter values to update the page with the chosen color
  return reply.view("/src/pages/index.hbs", params);
});

fastify.post("/api/vocab/add", async function (request, reply) {
  
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
  
  const entry = await createMorphologyEntry({key: vocabKey, headWord: morphData[0].lemma, word, morphData, meanings})
  
  reply.send(entry)
    
});


fastify.put("/api/vocab/update", async function (request, reply) {
  
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

fastify.get("/api/vocab/list/:key", async function (request, reply) {
  
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

fastify.delete("/api/vocab/delete/:key", async function (request, reply) {
  
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

fastify.get('/api/logeion/:word', async (req, res) => {
    try {
        const data = await getLogeionData(req.params.word);
        res.send(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Logeion data' });
    }
});


fastify.get("/api/morphology", async (req, res) => {
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

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
