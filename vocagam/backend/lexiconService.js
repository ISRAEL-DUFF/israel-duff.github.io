const { betaCodeToGreek } = require('beta-code-js');
const { parseStringPromise } = require("xml2js");
const xpath = require("xpath");
const { DOMParser } = require("xmldom");
// const dodsonData = require('./.data/lexica/dodson-dictionary.json');
const axios = require("axios")

const { Client } = require('pg');


const client = new Client(process.env.DIRECT_DATABASE_URL);
let connectedToDb = false;


function normalizeGreek(lemma) {
    const unicode = betaCodeToGreek(lemma);
    return unicode
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
}

async function extractLexiconSenses(lexiconEntryXml) {
    const wrappedXml = `<root>${lexiconEntryXml}</root>`;
    const json = await parseStringPromise(wrappedXml, {
      mergeAttrs: true,
      explicitArray: false,
      preserveChildrenOrder: true,
      charsAsChildren: true,
    });
  
    const senses = json.root.div2.sense.map(s => {
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
    })
  
    return senses;
}

async function extractLexiconSenses2(xmlEntry) {
  // Load XML file
  const xml = xmlEntry;
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  // Get all <sense> elements
  const senseNodes = xpath.select("//sense", doc);

  const results = [];

  senseNodes.forEach(sense => {
    const senseId = sense.getAttribute("id");
    const iTags = xpath.select(".//i", sense);
    const entries = [];
    
    const senseObj = {
            id: sense.getAttribute("id"),
            level: sense.getAttribute("level"),
            glosses: [],
            processedGloss: '',
            quotes: []
          };
    
    const quotes = xpath.select(".//cit", sense);
    senseObj.quotes = Array.from(quotes).map(cit => {
      const quote = (xpath.select(".//quote", cit))[0]?.textContent.trim();
      const bibl = (xpath.select(".//bibl", cit))[0];
      let biblRef = null;
      if (bibl) {
        biblRef = {
          author: (xpath.select(".//author", bibl))[0]?.textContent.trim() || null,
          title: (xpath.select(".//title", bibl))[0]?.textContent.trim() || null,
          passage: bibl.textContent.trim()
        };
      }
      return { quote, bibl: biblRef };
    });

    iTags.forEach(iTag => {
        const parent = iTag.parentNode;

        // Get the text before the <i> tag
        let before = "";
        if (iTag.previousSibling && iTag.previousSibling.nodeType === 3) {
          before = iTag.previousSibling.nodeValue.trim();
        } else if (parent.firstChild === iTag && parent.nodeType === 1) {
          before = parent.textContent.trim().split(iTag.textContent)[0] || "";
        }

        // Get the text inside <i>
        const tagText = iTag.textContent.trim();

        // Get the text after the <i> tag
        let after = "";
        if (iTag.nextSibling && iTag.nextSibling.nodeType === 3) {
          after = iTag.nextSibling.nodeValue.trim();
        }

        entries.push({
          senseId,
          before,
          tag: tagText,
          after
        });
      });
    

      if (entries.length) {
        // results.push(entries);
        senseObj.glosses = entries
        let processedText = '';
        let prevE = {}
        for(const e of entries) {
          processedText += `${prevE.after === e.before || !e.before ? '' : e.before} ${e.tag} ${e.after ? ' ' + e.after + ' ' : ''}`
          prevE = e
        }
        senseObj.processedGloss = processedText;
        
        results.push(senseObj)
      }
    });

    // console.log(JSON.stringify(results, null, 2));
     
  
  return results
}

async function extractLexiconSenses3(xmlEntry) {
	const doc = new DOMParser().parseFromString(xmlEntry, "text/xml");
	const senseNodes = xpath.select("//sense", doc);
	const results = [];
  
	const processCitation = (citation) => {
	  const quote = (xpath.select(".//quote", citation))[0]?.textContent.trim();
	  const bibl = (xpath.select(".//bibl", citation))[0];
	  let biblRef = null;
	  if (bibl) {
		  biblRef = {
		  author: (xpath.select(".//author", bibl))[0]?.textContent.trim() || null,
		  title: (xpath.select(".//title", bibl))[0]?.textContent.trim() || null,
		  passage: bibl.textContent.trim()
		  };
	  }
	  return { quote, bibl: biblRef };
	}
	
	const processBibl = (bibliology) => {
	  const title = (xpath.select(".//title", bibliology))[0]?.textContent.trim();
	  const author = (xpath.select(".//author", bibliology))[0];
	  const txt = xpath.select(".//text()", bibliology).join('')
	  
	  return { text: txt ?? '', title: title ?? '', author: author ?? '' };
	}
	
	senseNodes.forEach(sense => {
	  const children = xpath.select('./node()', sense);
	  let htmlText = '<div>';
	  let glosses = [];
	  let citations = [];
	  children.forEach((node, i) => {
		  // console.log(`[${i}] type: ${node.nodeType}, name: ${node.nodeName}, value: "${node.nodeValue || node.textContent}"`);
		  // const ignoredTexts = ['.', ',', ';', 'cf.', 'etc.;']
		  const ignoredTexts = []
  
		  if(node.nodeName === 'cit') {
			const citation = processCitation(node);
			htmlText += `<span class="inline-citation">${citation.quote}</span>`;
			citations.push(citation)
		  } else if(node.nodeName === '#text') {
			const text = node.textContent.trim();
			htmlText += `<span class="gloss-context">${ignoredTexts.includes(text) ? '' : text}</span>`;
		  } else if(node.nodeName === 'i') {
			const text = node.textContent.trim();
			glosses.push(text)
			htmlText += `<span class="gloss-sense">${text}</span>`;
		  } else if(node.nodeName === 'foreign') {
			const text = node.textContent.trim();
			htmlText += `<span class="foreign-text">${text}</span>`;
		  } else if(node.nodeName === 'bibl') {
			const bibl = processBibl(node);
			htmlText += `
			<span class="inline-bibl">
			  <span class="author">${bibl.author}</span>, 
			  <span class="title">${bibl.title}</span> 
			  <span class="reference">${bibl.text}</span>
			</span>`
		  }
	  });
  
	  htmlText += '</div>';
  
	  const senseObj = {
		id: sense.getAttribute("id"),
		level: sense.getAttribute("level"),
		htmlText,
		glosses,
		quotes: citations
	  }
  
	  results.push(senseObj)
	});
  
	console.log(results)
	return results;
}

async function fetchLexiconEntry(greekWord) {
    try {
        if(!connectedToDb) {
            await client.connect();
            connectedToDb = true;
        }

        const normalizedWord = normalizeGreek(greekWord)
        let columns = `word, beta_code, normalized_word, xml_entry`
        let whereCondition = `normalized_word = '${normalizedWord}' OR word = '${greekWord}'`
      
      
      // 4. Fetch random page
      const query = `
        SELECT ${columns} FROM lsj_lexicon
        WHERE ${whereCondition}
      `;

      console.log(query)
      const res = await client.query(query);
      
      for(const row of res.rows) {
        // row.senses = await extractLexiconSenses(row.xml_entry)
        row.senses = await extractLexiconSenses2(row.xml_entry)
      }
      
      // console.log(res.rows)

      return res.rows[0]
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}


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
        const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;

        const resRaw = await axios.get(url);
        let response = resRaw.data;
        let parsedResp = parsePerseusResponse(response);
        
        // console.log(JSON.stringify(parsedResp))

        return parsedResp;
    } catch (error) {
        console.log(error)
    }
}

async function fetchLexiconEntryWithMorphData(greekWord) {
  const morphology = await getPerseusMorph(greekWord)
  if(!morphology[0]?.lemma) {
    throw new Error("Invalid word")
  }
  const lexicalEntry = await fetchLexiconEntry(morphology[0].lemma);
  
  // console.log(lexicalEntry)
  
  const dodsonEntry = dodsonData[lexicalEntry.word];
  
  return {
    ...lexicalEntry,
    xml_entry: undefined,
    dodson: dodsonEntry,
    morphology
  }
}


lexicalEntryXml = `<div2 id="crossa)/grios" orig_id="n892" key="a)/grios" type="main" opt="n">
	<head extent="full" lang="greek" opt="n" orth_orig="ἄγριος">ἄγριος</head>, 
	<itype lang="greek" opt="n">α</itype>, 
	<itype lang="greek" opt="n">ον</itype>, 
	<bibl n="Perseus:abo:tlg,0012,002:9:119">
		<title>Od.</title> 9.119
	</bibl>
; also 
	<itype lang="greek" opt="n">ος</itype>, 
	<itype lang="greek" opt="n">ον</itype> (not in Trag. or com). 
	<bibl n="Perseus:abo:tlg,0012,001:19:88">
		<title>Il.</title> 19.88
	</bibl>, 
	<bibl n="Perseus:abo:tlg,1604,001:3:6" default="NO">
		<author>Phoc.</author> 3.6
	</bibl>, 

	<bibl n="Perseus:abo:tlg,0059,034:824a">
		<author>Pl.</author>
		<title>Lg.</title> 824a
	</bibl>, 
	<bibl n="Perseus:abo:tlg,0005,001:22:36">
		<author>Theoc.</author> 22.36
	</bibl>: 
	<gramGrp opt="n">
		<gram type="comp" opt="n">Comp.</gram>
	</gramGrp>
	<cit>
		<quote lang="greek">-ώτερος</quote>
		<bibl n="Perseus:abo:tlg,0003,001:6:60">
			<author>Th.</author> 6.60
		</bibl>
	</cit>: 
	<gramGrp opt="n">
		<gram type="comp" opt="n">Sup.</gram>
	</gramGrp>
	<cit>
		<quote lang="greek">-ώτατος</quote>
		<bibl n="Perseus:abo:tlg,0059,030:564a">
			<author>Pl.</author>
			<title>R.</title> 564a
		</bibl>
	</cit> 
(
	<etym lang="greek" opt="n">ἀγρός</etym>): 
	<sense id="n892.0" n="" level="1" opt="n">
		<i>living in the fields, wild, savage.</i>
	</sense>
	<sense n="I" id="n892.1" level="2" opt="n"> of animals, opp. 
		<foreign lang="greek">τιθασός ἥμερος,</foreign>
		<i>wild,</i>
		<cit>
			<quote lang="greek">βάλλειν ἄγρια πάντα</quote>
			<bibl n="Perseus:abo:tlg,0012,001:5:52">
				<title>Il.</title> 5.52
			</bibl>
		</cit>; 
		<foreign lang="greek">αἶξ, σῦς,</foreign>
		<bibl n="Perseus:abo:tlg,0012,001:3:24">3.24</bibl>, 
		<bibl n="Perseus:abo:tlg,0012,001:9:539">9.539</bibl>
; even of flies, 
		<cit>
			<quote lang="greek">ἄ. φῦλα, μυίας</quote>
			<bibl n="Perseus:abo:tlg,0012,001:19:30">19.30</bibl>
		</cit>; 
		<foreign lang="greek">ἵπποι, ὄνοι,</foreign> etc., 
		<bibl n="Perseus:abo:tlg,0016,001:7:86">
			<author>Hdt.</author> 7.86
		</bibl>, etc.; 

		<foreign lang="greek">ἄ. τέρας,</foreign> of a bull, 
		<bibl n="Perseus:abo:tlg,0006,005:1214">
			<author>E.</author>
			<title>Hipp.</title> 1214
		</bibl>; 

		<cit>
			<quote lang="greek">ἄ. θηρία</quote>
			<bibl n="Perseus:abo:tlg,0032,006:1:2:7">
				<author>X.</author>
				<title>An.</title> 1.2.7
			</bibl>
		</cit>; of men, 
		<i>living in a wild state,</i>
		<bibl n="Perseus:abo:tlg,0016,001:4:191">
			<author>Hdt.</author> 4.191
		</bibl>. 
	</sense>
	<sense n="2" id="n892.2" level="3" opt="n"> of trees, opp. 
		<foreign lang="greek">ἥμερος,</foreign>
		<i>wild,</i>
		<bibl n="Perseus:abo:tlg,0033,005:46" default="NO">
			<author>Pi.</author>
			<title>Fr.</title> 46
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0016,001:4:21">
			<author>Hdt.</author> 4.21
		</bibl>, etc.; 
		<foreign lang="greek">μητρὸς ἀγρίας ἄπο ποτόν</foreign> of the 
		<i>wild</i> vine, 
		<bibl n="Perseus:abo:tlg,0085,002:614">
			<author>A.</author>
			<title>Pers.</title> 614
		</bibl>, cf. 
		<bibl n="Perseus:abo:tlg,0086,036:896a:8" default="NO">
			<author>Arist.</author>
			<title>Pr.</title> 896a8
		</bibl>; 
		<cit>
			<quote lang="greek">ἄ. ἔλαιον</quote>
			<bibl n="Perseus:abo:tlg,0011,001:1197">
				<author>S.</author>
				<title>Tr.</title> 1197
			</bibl>
		</cit>; 
		<cit>
			<quote lang="greek">ὕλη</quote>
			<bibl n="Perseus:abo:tlg,0011,004:476">
				<author>Id.</author>
				<title>OT</title> 476
			</bibl>
		</cit>, etc.; 
		<cit>
			<quote lang="greek">μέλι</quote>
			<bibl n="Perseus:abo:tlg,0031,001:3:4">
				<title>Ev.Matt.</title> 3.4
			</bibl>
		</cit>. 
	</sense>
	<sense n="3" id="n892.3" level="3" opt="n"> of countries, 
		<i>wild, uncultivated,</i>
		<bibl n="Perseus:abo:tlg,0059,004:113b">
			<author>Pl.</author>
			<title>Phd.</title> 113b
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0059,034:905b">
			<title>Lg.</title> 905b
		</bibl>. 
	</sense>
	<sense n="II" id="n892.4" level="2" opt="n"> mostly of men, beasts, etc.: </sense>
	<sense n="1" id="n892.5" level="3" opt="n"> in moral sense, 
		<i>savage, fierce,</i>
		<bibl n="Perseus:abo:tlg,0012,001:8:96">
			<title>Il.</title> 8.96
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0012,002:1:199">
			<title>Od.</title> 1.199
		</bibl>, etc., cf. 
		<bibl n="Perseus:abo:tlg,0019,003:567">
			<author>Ar.</author>
			<title>Nu.</title> 567
		</bibl>; 
		<cit>
			<quote lang="greek">δεσπότης</quote>
			<bibl n="Perseus:abo:tlg,0059,030:329c">
				<author>Pl.</author>
				<title>R.</title> 329c
			</bibl>
		</cit>; 
		<cit>
			<quote lang="greek">ἄ. καὶ ἀπαίδευτος</quote>
			<bibl n="Perseus:abo:tlg,0059,023:510b">
				<author>Id.</author>
				<title>Grg.</title> 510b
			</bibl>
		</cit>; 
		<cit>
			<quote lang="greek">ἄγριε παῖ καὶ στυγνέ</quote>
			<bibl n="Perseus:abo:tlg,0005,001:23:19">
				<author>Theoc.</author> 23.19
			</bibl>
		</cit>, cf. 
		<bibl n="Perseus:abo:tlg,0005,001:2:54">2.54</bibl>; 
		<foreign lang="greek">ἄ. κυβευτής</foreign> a 
		<i>passionate</i> gambler, 
		<bibl n="Perseus:abo:tlg,0541,001:965" default="NO">
			<author>Men.</author> 965
		</bibl>; esp. of 
		<foreign lang="greek">παιδερασταί,</foreign>
		<bibl n="Perseus:abo:tlg,0019,003:349">
			<author>Ar.</author>
			<title>Nu.</title> 349
		</bibl> (cf. Sch. ad loc.), 
		<bibl n="Perseus:abo:tlg,0026,001:52">
			<author>Aeschin.</author> 1.52
		</bibl>, 
		<bibl n="Perseus:abo:tlg,4001,001:p.14B" default="NO">
			<author>Aen.Gaz.</author>
			<title>Thphr.</title> p.14B
		</bibl>. 
	</sense>
	<sense n="2" id="n892.6" level="3" opt="n"> of temper, 
		<i>wild, fierce,</i>
		<foreign lang="greek">θυμός, χόλος,</foreign>
		<bibl n="Perseus:abo:tlg,0012,001:9:629">
			<title>Il.</title> 9.629
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0012,001:4:23">4.23</bibl>; 
		<cit>
			<quote lang="greek">λέων δʼ ὥς, ἄγρια οἶδεν</quote>
			<bibl n="Perseus:abo:tlg,0012,001:24:41">24.41</bibl>
		</cit>; 
		<foreign lang="greek">ἄ. πτόλεμος, μῶλος,</foreign>
		<bibl n="Perseus:abo:tlg,0012,001:17:737">17.737</bibl>, 
		<bibl n="Perseus:abo:tlg,0012,001:17:398">398</bibl>; 
		<cit>
			<quote lang="greek">ἄγριος ἄτη</quote>
			<bibl n="Perseus:abo:tlg,0012,001:19:88">19.88</bibl>
		</cit>; 
		<foreign lang="greek">ἄ. ὁδοί</foreign>
		<i>cruel</i> ways or counsels, 
		<bibl n="Perseus:abo:tlg,0011,002:1274">
			<author>S.</author>
			<title>Ant.</title> 1274
		</bibl>; 
		<cit>
			<quote lang="greek">ὀργή</quote>
			<bibl n="Perseus:abo:tlg,0011,004:344">
				<title>OT</title> 344
			</bibl>
		</cit> (
		<gramGrp opt="n">
			<gram type="comp" opt="n">Sup.</gram>
		</gramGrp>); 
		<cit>
			<quote lang="greek">ἀγριώτατα ἤθεα</quote>
			<bibl n="Perseus:abo:tlg,0016,001:4:106">
				<author>Hdt.</author> 4.106
			</bibl>
		</cit>; 
		<cit>
			<quote lang="greek">ἔρωτες</quote>
			<bibl n="Perseus:abo:tlg,0059,004:81a">
				<author>Pl.</author>
				<title>Phd.</title> 81a
			</bibl>
		</cit>; 
		<cit>
			<quote lang="greek">φιλία</quote>
			<bibl n="Perseus:abo:tlg,0059,034:837b">
				<author>Id.</author>
				<title>Lg.</title> 837b
			</bibl>
		</cit>, cf. 
		<bibl n="Perseus:abo:tlg,0059,030:572b">
			<title>R.</title> 572b
		</bibl>, etc.; 
		<foreign lang="greek">τὸ ἄ.</foreign>
		<i>savageness,</i>
		<bibl n="Perseus:abo:tlg,0059,005:394e">
			<author>Id.</author>
			<title>Cra.</title> 394e
		</bibl>; 
		<foreign lang="greek">ἐς τὸ -ώτερον</foreign>
		<i>to harsher measures,</i>
		<author>Th.</author> l.c. 
	</sense>
	<sense n="3" id="n892.7" level="3" opt="n"> of things, circumstances, etc., 
		<i>cruel, harsh,</i>
		<cit>
			<quote lang="greek">δεσμά</quote>
			<bibl n="Perseus:abo:tlg,0085,003:177">
				<author>A.</author>
				<title>Pr.</title> 177
			</bibl>
		</cit>; 
		<foreign lang="greek">νὺξ -ωτέρη</foreign>
		<i>wild, stormy,</i>
		<bibl n="Perseus:abo:tlg,0016,001:8:13">
			<author>Hdt.</author> 8.13
		</bibl>; 
		<cit>
			<quote lang="greek">δουλεία</quote>
			<bibl n="Perseus:abo:tlg,0059,030:564a">
				<author>Pl.</author>
				<title>R.</title> 564a
			</bibl>
		</cit>; 
		<foreign lang="greek">σύντασις ἀ.</foreign> a 
		<i>violent</i> strain, 
		<bibl n="Perseus:abo:tlg,0059,010:46d">
			<author>Id.</author>
			<title>Phlb.</title> 46d
		</bibl>; 
		<foreign lang="greek">ἄ. βάρος,</foreign> of strong, hot wine, 
		<bibl n="Perseus:abo:tlg,0019,012:351" default="NO">
			<author>Ar.</author>
			<title>Fr.</title> 351
		</bibl>. 
	</sense>
	<sense n="b" id="n892.8" level="4" opt="n">
		<foreign lang="greek">ἀ. νόσος,</foreign> prob., 
		<i>malignant,</i>
		<bibl n="Perseus:abo:tlg,0011,006:173">
			<author>S.</author>
			<title>Ph.</title> 173
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0011,006:265">265</bibl>; 
		<cit>
			<quote lang="greek">ἄ. ἕλκος</quote>
			<bibl n="Perseus:abo:tlg,0036,001:1:16" default="NO">
				<author>Bion</author> 1.16
			</bibl>
		</cit>. 
	</sense>
	<sense n="III" id="n892.9" level="2" opt="n">
		<pos opt="n">Adv.</pos>
		<foreign lang="greek">-ίως,</foreign>
		<i>savagely,</i>
		<bibl n="Perseus:abo:tlg,0085,007:972">
			<author>A.</author>
			<title>Eu.</title> 972
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0019,004:705">
			<author>Ar.</author>
			<title>V.</title> 705
		</bibl>; 
		<foreign lang="greek">ἄγρια δερκομένω, παίσδων,</foreign>
		<bibl n="Perseus:abo:tlg,0020,003:236">
			<author>Hes.</author>
			<title>Sc.</title> 236
		</bibl>, 
		<bibl n="Perseus:abo:tlg,0035,001:1:11" default="NO">
			<author>Mosch.</author> 1.11
		</bibl>. [
		<pron extent="full" lang="greek" opt="n">ᾱ</pron>
		<author>Hom.</author>; 
		<pron extent="full" lang="greek" opt="n">ᾱ</pron> in trim., 
		<pron extent="full" lang="greek" opt="n">ᾰ</pron> in lyr. 
		<author>A.</author> and 
		<author>S.</author>; 
		<itype lang="greek" opt="n">ᾱ/ᾰ</itype>
		<author>E.</author>; 
		<pron extent="full" lang="greek" opt="n">ῑ</pron> metri grat., where the ult. is long, 
		<bibl n="Perseus:abo:tlg,0012,001:22:313">
			<title>Il.</title> 22.313
		</bibl> (nisi leg. 
		<foreign lang="greek">ἀγρίοο</foreign>).]
	</sense>
</div2>
`

extractLexiconSenses3(lexicalEntryXml).then(console.log).catch((e) => console.log(e))


module.exports = {
    fetchLexiconEntry,
  fetchLexiconEntryWithMorphData
};


// HEBRW lexicon
// https://github.com/openscriptures/strongs/tree/master
// DBD dictionary: https://github.com/eliranwong/unabridged-BDB-Hebrew-lexicon/blob/master/DictBDB.json
// https://github.com/openscriptures/HebrewLexicon/tree/master

// Greek (Septuagint)
// https://github.com/openscriptures/GreekResources/tree/master