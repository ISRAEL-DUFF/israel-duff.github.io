const fs = require('fs');
const path = require('path');

// Assuming lesson1 is already defined in this file
const lesson1 = [
  {
    "Hebrew": "Lesson 2",
    "English": "",
    "Part of Speech": ""
  },
  {
    "Hebrew": "אִישׁ, אֲנָשִׁים",
    "English": "man",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אִשָּׁה, נָשִׁים",
    "English": "woman, wife",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אֵל",
    "English": "God, god",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אֱלֹהִים",
    "English": "God, gods",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אָמַר",
    "English": "say",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "אֲשֶׁר",
    "English": "that",
    "Part of Speech": "(particle)"
  },
  {
    "Hebrew": "בּוֹא",
    "English": "come, go",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "בַּיִת, בָּתִּים",
    "English": "house",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "בָּרַךְ",
    "English": "bless",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "הָיָה",
    "English": "be",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "הַר",
    "English": "mountain, hill",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יְהֹוָה",
    "English": "Yahweh",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יְרוּשָׁלִַ͏ם",
    "English": "Jerusalem",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "מַיִם",
    "English": "waters, water",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "שָׁמַיִם",
    "English": "heavens, sky",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "סָבִיב",
    "English": "circuit, round about",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עַד",
    "English": "until",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "עוֹלָם",
    "English": "long duration, eternity",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עַם",
    "English": "people",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עָשָׂה",
    "English": "do, make",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "מַעֲשֶׂה",
    "English": "deed, work",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עַתָּה",
    "English": "now",
    "Part of Speech": "(adverb)"
  },
  {
    "Hebrew": "שֵׁם",
    "English": "name",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "שָׁמַר",
    "English": "guard, preserve",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "Lesson 4",
    "English": "",
    "Part of Speech": ""
  },
  {
    "Hebrew": "אוֹר",
    "English": "light (f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אֶרֶץ",
    "English": "earth, land (m/f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "בָּטַח",
    "English": "trust",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "הָלַל",
    "English": "be boastful, praise",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "חֹדֶשׁ",
    "English": "month, new moon",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יָדָה",
    "English": "give thanks, confess",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "יוֹם",
    "English": "day",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יָרֵא",
    "English": "fear",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "כָּל / כֹּל",
    "English": "the whole, all",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "נָתַן",
    "English": "give, put, set",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "פֶּה",
    "English": "mouth",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "פָּנִים",
    "English": "face (m/f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "רָאָה",
    "English": "see",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "מַרְאֶה",
    "English": "sight, appearance",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "רַב",
    "English": "much, many, great",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "רֹב",
    "English": "multitude, abundance, greatness",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "רָבָה",
    "English": "be/become great, many",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "שׂוּם",
    "English": "put, set",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "שָׁלוֹם",
    "English": "completeness, welfare, peace",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "שָׁלַם",
    "English": "be complete, sound",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "שְׁלֹמֹה",
    "English": "Solomon",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "Lesson 6",
    "English": "",
    "Part of Speech": ""
  },
  {
    "Hebrew": "בֵּן",
    "English": "son",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "בַּת, בָּנוֹת",
    "English": "daughter",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "חָצֵר",
    "English": "enclosure, court",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יָדַע",
    "English": "know",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "יְהוֹשׁוּעַ",
    "English": "Joshua",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יְשׁוּעָה",
    "English": "salvation, deliverance",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יָשַׁע",
    "English": "deliver",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "לֹא",
    "English": "not",
    "Part of Speech": "(particle)"
  },
  {
    "Hebrew": "נָשָׂא",
    "English": "lift up, carry",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "עֶבֶד",
    "English": "slave, servant",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עָבַד",
    "English": "work, serve",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "עֲבֹדָה",
    "English": "labor",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "צֹאן",
    "English": "flock",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "שַׁעַר",
    "English": "gate",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אָנֹכִי / אֲנִי",
    "English": "I",
    "Part of Speech": "(first person pronoun)"
  },
  {
    "Hebrew": "אֲנַחְנוּ",
    "English": "we",
    "Part of Speech": "(first person pronoun)"
  },
  {
    "Hebrew": "אַתָּה",
    "English": "you [sir]",
    "Part of Speech": "(second person pronoun)"
  },
  {
    "Hebrew": "אַתְּ",
    "English": "you [ma’am]",
    "Part of Speech": "(second person pronoun)"
  },
  {
    "Hebrew": "אַתֶּם",
    "English": "you all",
    "Part of Speech": "(second person pronoun)"
  },
  {
    "Hebrew": "אַתֵּנָה / אַתֶּן",
    "English": "[ladies] you all",
    "Part of Speech": "(second person pronoun)"
  },
  {
    "Hebrew": "הוּא",
    "English": "he/that",
    "Part of Speech": "(third person pronoun) (demonstrative pronoun)"
  },
  {
    "Hebrew": "הִוא / הִיא",
    "English": "she/that",
    "Part of Speech": "(third person pronoun) (demonstrative pronoun)"
  },
  {
    "Hebrew": "הֵמָּה / הֵם",
    "English": "they",
    "Part of Speech": "(third person pronoun)"
  },
  {
    "Hebrew": "הֵנָּה / הֵן",
    "English": "[those ladies]",
    "Part of Speech": "(third person pronoun)"
  },
  {
    "Hebrew": "זֹה / זֶה",
    "English": "this (ms)",
    "Part of Speech": "(demonstrative pronoun)"
  },
  {
    "Hebrew": "זֹאת",
    "English": "this (fs)",
    "Part of Speech": "(demonstrative pronoun)"
  },
  {
    "Hebrew": "אֵלֶּה",
    "English": "these (cp)",
    "Part of Speech": "(demonstrative pronoun)"
  },
  {
    "Hebrew": "הֵמָּה / הֵם",
    "English": "those (mp)",
    "Part of Speech": "(demonstrative pronoun)"
  },
  {
    "Hebrew": "הֵנָּה",
    "English": "those (fp)",
    "Part of Speech": "(demonstrative pronoun)"
  },
  {
    "Hebrew": "Lesson 8",
    "English": "",
    "Part of Speech": ""
  },
  {
    "Hebrew": "אָז",
    "English": "at that time, then",
    "Part of Speech": "(adverb)"
  },
  {
    "Hebrew": "אַחַר",
    "English": "after",
    "Part of Speech": "(adverb, preposition)"
  },
  {
    "Hebrew": "אֵל",
    "English": "to, toward",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "אֵת",
    "English": "with",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "אֵת",
    "English": "[direct object marker]",
    "Part of Speech": "(particle)"
  },
  {
    "Hebrew": "גָּדוֹל",
    "English": "great",
    "Part of Speech": "(adjective)"
  },
  {
    "Hebrew": "גָּדַל",
    "English": "grow up, become great",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "יָד",
    "English": "hand (m/f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יִשְׂרָאֵל",
    "English": "Israel (f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "כְּמוֹ",
    "English": "like, as, when",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "לִפְנֵי",
    "English": "before, in front of",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "לָשׁוֹן, לְשֹׁנוֹת",
    "English": "tongue (m/f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "מוּת",
    "English": "die",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "מָוֶת",
    "English": "death (m)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "מָלֵא",
    "English": "fulfill, fill",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "מִן",
    "English": "from",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "נֶפֶשׁ",
    "English": "soul, life (m/f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עַיִן",
    "English": "eye",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "עַל",
    "English": "upon, according to",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "עִם",
    "English": "with",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "צִיּוֹן",
    "English": "Zion (f)",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "שׁוּב",
    "English": "turn back, return",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "שָׂמַח",
    "English": "rejoice",
    "Part of Speech": "(adjective, verb)"
  },
  {
    "Hebrew": "תַּחַת",
    "English": "under, instead of",
    "Part of Speech": "(preposition)"
  },
  {
    "Hebrew": "Lesson 10",
    "English": "",
    "Part of Speech": ""
  },
  {
    "Hebrew": "אַהֲרוֹן",
    "English": "Aaron",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "אוֹ",
    "English": "or",
    "Part of Speech": "(conjunction)"
  },
  {
    "Hebrew": "אִם",
    "English": "if",
    "Part of Speech": "(conjunction)"
  },
  {
    "Hebrew": "גָּאַל",
    "English": "redeem, act as kinsman",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "גּוֹי",
    "English": "nation, people",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "דָבַר",
    "English": "speak",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "דָּבָר",
    "English": "speech, word, matter",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "יַעַן",
    "English": "on account of, because",
    "Part of Speech": "(conjunction)"
  },
  {
    "Hebrew": "כֹּה",
    "English": "thus, here",
    "Part of Speech": "(adverb)"
  },
  {
    "Hebrew": "כִּי",
    "English": "that, for, when",
    "Part of Speech": "(conjunction)"
  },
  {
    "Hebrew": "לְמַעַן",
    "English": "in order that, on account of",
    "Part of Speech": "(conjunction, preposition)"
  },
  {
    "Hebrew": "מֶלֶךְ",
    "English": "king",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "מָלַךְ",
    "English": "reign",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "מַמְלָכָה",
    "English": "kingdom, reign",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "מֹשֶׁה",
    "English": "Moses",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "פֵּן",
    "English": "lest",
    "Part of Speech": "(conjunction)"
  },
  {
    "Hebrew": "קוּם",
    "English": "arise, stand up",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "קָרָא",
    "English": "call, proclaim",
    "Part of Speech": "(verb)"
  },
  {
    "Hebrew": "רֹאשׁ",
    "English": "head, chief",
    "Part of Speech": "(noun)"
  },
  {
    "Hebrew": "רִאשׁוֹן",
    "English": "former, first, chief",
    "Part of Speech": "(adjective)"
  },
  {
    "Hebrew": "רַע",
    "English": "evil, distress",
    "Part of Speech": "(adjective, noun)"
  }
]

function transformAndSaveVocabList(vocabList, outputFile) {
 let transformed = {}
 let currentGroup = '';
  
 for(const entry of vocabList) {
    if (entry.Hebrew.indexOf('Lesson') === 0) {
      currentGroup = entry.Hebrew.trim();
      transformed[currentGroup] = [];
    } else {
      transformed[currentGroup].push({
        word: entry.Hebrew.trim(),
        meanings: entry.English.trim().split(',').map(m => m.trim()),
        partOfSpeech: entry["Part of Speech"].trim(),
        frequency: 1
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2), 'utf8');
  console.log(`✅ Transformed vocab list saved to ${outputFile}`);
}

// Usage:
transformAndSaveVocabList(
  lesson1,
  path.join(__dirname, '../data/bible-arc-data/hebrew/transformed-hebrew-vocab.json')
);