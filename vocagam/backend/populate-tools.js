const axios = require("axios")
// const coreList = require("../word-bank/greek/greek_core_list.json")
const data1 = require("../word-bank/greek/data1.json")

// const list = coreList["199 - 50"];
const list = data1['adjectives_one'];

async function addWord(word) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            // const url1 = `https://greek-comics.vercel.app/word-expansion/?word=${encodeURIComponent(word)}`;
            const url1 = `http://localhost:9003/api/expand`;
            // const url2 = `https://ai-powered-lexicon-iwis.vercel.app/lexicon/?word=${encodeURIComponent(word)}`;
            const url2 = `http://localhost:9002/api/lexicon`;
            const payload = {
                word,
            }
            try {
                const resp = await Promise.all([
                    axios.post(url1, payload),
                    axios.post(url2, payload)
                ])
                const respList = [];
                for(const r of resp) {
                    if(r.status !== 200) {
                        reject(r);
                        return;
                    }
                    
                    respList.push({
                        word,
                        data: r.data.data
                    })
                }
                resolve(respList)
            } catch (error) {
                reject(error)
            }
        }, 5000)
    })
}

async function addToWordExpansion() {
    let n = 0;
    let word = '';
    try {
        for(let i = 0; i < list.length; i++) {
            n = i;
            word = list[i].word;
            console.log('sending...', word, n)
            const respList = await addWord(word);
            console.log('sent', word, n)
            console.log(respList)
        }
    } catch (error) {
        console.log(error);
        console.log({
            n,
            word
        });

        throw error;
    }
}

addToWordExpansion().then(() => {
    console.log("done")
}).catch((error) => {
    console.log(error)
})