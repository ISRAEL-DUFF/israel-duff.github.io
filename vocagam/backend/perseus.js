const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const { lookupHeadwordByGreek, lookupHeadwordByGreek2 } = require("./lsj-lookup");
const dodsonData = require('./data/dodson-dictionary.json');

const app = express();
const PORT = 3000;


function extractAllGreekDefinitions(wikitext) {
    const result = [];
  
    // 1. Isolate Ancient Greek section
    const greekSection = wikitext.split("==Ancient Greek==")[1]?.split("==Greek==")[0];
    if (!greekSection) return result;
  
    // 2. Match all POS sections inside Ancient Greek
    const posPattern = /===([A-Za-z\s]+)===\n([\s\S]*?)(?===|$)/g;
    let match;
    while ((match = posPattern.exec(greekSection)) !== null) {
      const pos = match[1].trim();           // e.g., "Noun", "Verb", "Adjective"
      const body = match[2].trim();
  
      // 3. Extract definition lines from this section
      const lines = body.split("\n");
      const definitions = lines
        .filter(line => line.trim().startsWith("#"))
        .map(line =>
          line
            .replace(/^#\*? ?/, "")
            .replace(/\[\[([^\|\]]+)\|?([^\]]*)\]\]/g, (_, word, alt) => alt || word) // [[foo|bar]] or [[foo]]
            .replace(/{{[^}]+}}/g, "")
            .replace(/''/g, "")
            .trim()
        );
  
      if (definitions.length > 0) {
        result.push({ partOfSpeech: pos, definitions });
      }
    }
  
    return result;
}

function parsePerseusResponse(response) {
    const bodies = response?.RDF?.Annotation?.Body;
    if (!bodies || !Array.isArray(bodies)) return [];
  
    const rawOutput = bodies.map(body => {
      const entry = body.rest?.entry;
      const dict = entry?.dict || {};
      const infls = Array.isArray(entry?.infl) ? entry.infl : [entry?.infl].filter(Boolean);
  
      // Base lemma + POS
      const base = {
        lemma: dict.hdwd?.["$"] || null,
        partOfSpeech: dict.pofs?.["$"] || null,
      };
  
      // Try to normalize morphological features
      const morphData = infls.map(infl => ({
        ...base,
        case: infl?.case?.["$"] || null,
        gender: infl?.gend?.["$"] || null,
        number: infl?.num?.["$"] || null,
        tense: infl?.tense?.["$"] || null,
        voice: infl?.voice?.["$"] || null,
        mood: infl?.mood?.["$"] || null,
        person: infl?.pers?.["$"] || null,
        stem: infl?.term?.stem?.["$"] || null,
        suffix: infl?.term?.suff?.["$"] || null,
        morph: infl?.morph?.["$"] || null,
        stemtype: infl?.stemtype?.["$"] || null
      }));
  
      // If there's no inflection, just return the base info
      return morphData.length > 0 ? morphData : [base];
    }).flat(); // flatten in case of multiple analyses

    // remove null fields
    return rawOutput.map((o) => {
        let d = {}
        for(const k of Object.keys(o)) {
            if(o[k]) {
                d[k] = o[k]
            }
        }

        return d;
    })
}

function parsePerseusResponse2(response) {
    const body = response?.RDF?.Annotation?.Body;
    if (!body) return [];
  
    const bodyList = Array.isArray(body) ? body : [body];
    const rawOutput = bodyList.flatMap(bodyItem => {
      const entry = bodyItem.rest?.entry;
      const dict = entry?.dict || {};
      const infls = Array.isArray(entry?.infl) ? entry.infl : [entry?.infl].filter(Boolean);
  
      const base = {
        lemma: dict.hdwd?.["$"] || null,
        partOfSpeech: dict.pofs?.["$"] || null
      };
  
      return infls.map(infl => ({
        ...base,
        case: infl?.case?.["$"] || null,
        gender: infl?.gend?.["$"] || null,
        number: infl?.num?.["$"] || null,
        tense: infl?.tense?.["$"] || null,
        voice: infl?.voice?.["$"] || null,
        mood: infl?.mood?.["$"] || null,
        person: infl?.pers?.["$"] || null,
        stem: infl?.term?.stem?.["$"] || null,
        suffix: infl?.term?.suff?.["$"] || null,
        morph: infl?.morph?.["$"] || null,
        stemtype: infl?.stemtype?.["$"] || null,
        derivtype: infl?.derivtype?.["$"] || null,
        dialect: infl?.dial?.["$"] || null
      }));
    });

    // remove null fields
    return rawOutput.map((o) => {
        let d = {}
        for(const k of Object.keys(o)) {
            if(o[k]) {
                d[k] = o[k]
            }
        }

        return d;
    })
}


  async function getMeaning(headWord) {
    return new Promise(async (resolve, reject) => {
        try {
            const lexicaUrl = `https://en.wiktionary.org/w/api.php?action=query&titles=${headWord}&prop=revisions&rvprop=content&format=json`
            console.log(lexicaUrl)
            const response = await axios.get(lexicaUrl);
            console.log(JSON.stringify(response.data))
            let meanings = [];
            if(response.data.query.pages[0]) {
                meanings = extractAllGreekDefinitions(response.data.query.pages[0].revisions[0].slots.main.content);
            } else {
                // console.log(response.data.query.pages[`${Object.keys(response.data.query.pages)[0]}`].revisions[0]['*'], response.data.query.pages)
                meanings = extractAllGreekDefinitions(response.data.query.pages[`${Object.keys(response.data.query.pages)[0]}`].revisions[0]['*']);   
            }
            console.log({
                resp: JSON.stringify(response.data),
                resp2:meanings[0].definitions
            })
        
            return resolve(meanings[0].definitions);
          } catch (error) {
            reject(error)
          }
    })
    
  }

app.get("/morphology", async (req, res) => {
  const word = req.query.word;
  if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });

  try {
    const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
    const response = await axios.get(url);

    // console.log(response.data)
    

    //   const analysis = result?.morphologicalAnalysis?.analysis?.body;
    //   res.json(analysis || { message: "No analysis found" });
    // });

    let parseResp = parsePerseusResponse2(response.data);
    
    console.log({
        // parse1: parsePerseusResponse(response.data),
        parse2: parseResp
    })

    // console.log(parseNoun(response.data))
    // console.log(parseVerb(response.data))

    console.log('MEANING:', await getMeaning(parseResp[0].lemma))
    return res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analysis", details: error.message });
  }
});

app.get("/morphology-and-meanings", async (req, res) => {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });
  
    try {
      const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
      const response = await axios.get(url);
  
      let parseResp = parsePerseusResponse2(response.data);
      const responseData = {
        morphData: parseResp,
        meanings: await getMeaning(parseResp[0].lemma)
      }
  
      return res.json(responseData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis", details: error.message });
    }
});

app.get("/lexica", async (req, res) => {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });
  
    try {
        const responseData = await lookupHeadwordByGreek(word);
        const dodsonResp = dodsonData[word];
  
      return res.json({
        lsj: {
            key: responseData.key,
            senses: responseData.entry.sense.map(s => {
                if(typeof s.i === 'string') {
                    return {
                        introText: s._,
                        meanings:s.i
                    };
                } else if(Array.isArray(s.i)) {
                    const meanings = s.i.reduce((acc, item) => {
                        acc += ` ${item};`;
                        return acc;
                    }, '');

                    return {
                        introText: s._,
                        meanings:meanings
                    };
                } else {
                    return '-';
                }
            }),
            // sense: responseData.entry.sense,
            // sense2: responseData.entry.sense[1].i,
            // sense3: responseData.entry.sense[2].i,
            // sense4: responseData.entry.sense[3].i,
            // sense5: responseData.entry.sense[4].i,
        },
        dodson: dodsonResp
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis", details: error.message });
    }
});

app.get("/lexica2", async (req, res) => {
    const word = req.query.word;
    if (!word) return res.status(400).json({ error: "Missing 'word' parameter" });
  
    try {
        const responseData = await lookupHeadwordByGreek2(word);
        const dodsonResp = dodsonData[word];
  
      return res.json({
        lsj: responseData,
        dodson: dodsonResp
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis", details: error.message });
    }
});


app.listen(PORT, () => {
  console.log(`Morphology server listening at http://localhost:${PORT}`);
});

// Participle: ἐπινοουμένης
// Noun: σωτῆρος
// Verb: ἐλάμβανεν
// Adjective: αὐτοῦ

// λέγω
// καλέω
// τίκτω
// θεάομαι

