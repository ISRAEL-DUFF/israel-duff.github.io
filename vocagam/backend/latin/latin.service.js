const axios = require("axios")

// <<<< MORPHESEUS >>>>
function parsePerseusResponse(response) {
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

async function getPerseusMorph(word) {
    if (!word) {
        throw new Error('Word cannot be empty')
    }

    try {
        // const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
        const url = `http://localhost:1500/analysis/word?lang=lat&engine=morpheuslat&word=${encodeURIComponent(word)}`;
        
        const resRaw = await axios.get(url);
        let response = resRaw.data;
        let parsedResp = parsePerseusResponse(response);
        
        return parsedResp;
    } catch (error) {
        console.log(error)
    }
}

async function fetchLexiconEntriesAndMorphology(word) {
    const morphology = await getPerseusMorph(word);

    return {
        morphology
    }
}

module.exports = {
    fetchLexiconEntriesAndMorphology
}