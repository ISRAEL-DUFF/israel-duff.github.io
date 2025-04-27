// Greek Verb Endings Database - Attic + Koine Standard

export const finiteVerbEndings = {
    present: {
      indicative: {
        active: [
          { ending: "ω", person: "1st", number: "singular" },
          { ending: "εις", person: "2nd", number: "singular" },
          { ending: "ει", person: "3rd", number: "singular" },
          { ending: "ομεν", person: "1st", number: "plural" },
          { ending: "ετε", person: "2nd", number: "plural" },
          { ending: "ουσι(ν)", person: "3rd", number: "plural" },
        ],
        middle: [
          { ending: "ομαι", person: "1st", number: "singular" },
          { ending: "ῃ", person: "2nd", number: "singular" },
          { ending: "εται", person: "3rd", number: "singular" },
          { ending: "ομεθα", person: "1st", number: "plural" },
          { ending: "εσθε", person: "2nd", number: "plural" },
          { ending: "ονται", person: "3rd", number: "plural" },
        ],
        passive: [] // Present passive = present middle
      },
      
      subjunctive: {
        active: [
          { ending: "ω", person: "1st", number: "singular" },
          { ending: "ῃς", person: "2nd", number: "singular" },
          { ending: "ῃ", person: "3rd", number: "singular" },
          { ending: "ωμεν", person: "1st", number: "plural" },
          { ending: "ητε", person: "2nd", number: "plural" },
          { ending: "ωσι(ν)", person: "3rd", number: "plural" },
        ],
        middle: [
          { ending: "ωμαι", person: "1st", number: "singular" },
          { ending: "ῃ", person: "2nd", number: "singular" },
          { ending: "ηται", person: "3rd", number: "singular" },
          { ending: "ωμεθα", person: "1st", number: "plural" },
          { ending: "ησθε", person: "2nd", number: "plural" },
          { ending: "ωνται", person: "3rd", number: "plural" },
        ],
        passive: []
      },
      optative: {
        active: [
          { ending: "οιμι", person: "1st", number: "singular" },
          { ending: "οις", person: "2nd", number: "singular" },
          { ending: "οι", person: "3rd", number: "singular" },
          { ending: "οιμεν", person: "1st", number: "plural" },
          { ending: "οιτε", person: "2nd", number: "plural" },
          { ending: "οιεν", person: "3rd", number: "plural" },
        ],
        middle: [
          { ending: "οιμην", person: "1st", number: "singular" },
          { ending: "οιο", person: "2nd", number: "singular" },
          { ending: "οιτο", person: "3rd", number: "singular" },
          { ending: "οιμεθα", person: "1st", number: "plural" },
          { ending: "οισθε", person: "2nd", number: "plural" },
          { ending: "οιντο", person: "3rd", number: "plural" },
        ],
        passive: []
      },
      imperative: {
        active: [
          { ending: "ε", person: "2nd", number: "singular" },
          { ending: "ετε", person: "2nd", number: "plural" },
        ],
        middle: [
          { ending: "ου", person: "2nd", number: "singular" },
          { ending: "εσθε", person: "2nd", number: "plural" },
        ],
        passive: []
      }
    },
    imperfect: {
      indicative: {
        active: [
          { ending: "ον", person: "1st", number: "singular" },
          { ending: "ες", person: "2nd", number: "singular" },
          { ending: "ε(ν)", person: "3rd", number: "singular" },
          { ending: "ομεν", person: "1st", number: "plural" },
          { ending: "ετε", person: "2nd", number: "plural" },
          { ending: "ον", person: "3rd", number: "plural" },
        ],
        middle: [
          { ending: "ομην", person: "1st", number: "singular" },
          { ending: "ου", person: "2nd", number: "singular" },
          { ending: "ετο", person: "3rd", number: "singular" },
          { ending: "ομεθα", person: "1st", number: "plural" },
          { ending: "εσθε", person: "2nd", number: "plural" },
          { ending: "οντο", person: "3rd", number: "plural" },
        ],
        passive: []
      }
    },
    future: {
      indicative: {
        active: [
          { ending: "σω", person: "1st", number: "singular" },
          { ending: "σεις", person: "2nd", number: "singular" },
          { ending: "σει", person: "3rd", number: "singular" },
          { ending: "σομεν", person: "1st", number: "plural" },
          { ending: "σετε", person: "2nd", number: "plural" },
          { ending: "σουσι(ν)", person: "3rd", number: "plural" },
        ],
        middle: [
          { ending: "σομαι", person: "1st", number: "singular" },
          { ending: "σῃ", person: "2nd", number: "singular" },
          { ending: "σεται", person: "3rd", number: "singular" },
          { ending: "σομεθα", person: "1st", number: "plural" },
          { ending: "σεσθε", person: "2nd", number: "plural" },
          { ending: "σονται", person: "3rd", number: "plural" },
        ],
        passive: [
          { ending: "θησομαι", person: "1st", number: "singular" },
          { ending: "θησῃ", person: "2nd", number: "singular" },
          { ending: "θησεται", person: "3rd", number: "singular" },
          { ending: "θησομεθα", person: "1st", number: "plural" },
          { ending: "θησεσθε", person: "2nd", number: "plural" },
          { ending: "θησονται", person: "3rd", number: "plural" },
        ]
      }
    },

    // Greek Contract Verb Endings
    contractVerbEndings: {
        present: {
          indicative: {
            active: [
              // For contract verbs ending in -αω, -εω, -οω (1st singular)
              { ending: "ῶ", person: "1st", number: "singular" },  // For verbs like λύω, ποιέω, etc.
              { ending: "εις", person: "2nd", number: "singular" },
              { ending: "ει", person: "3rd", number: "singular" },
              { ending: "ομεν", person: "1st", number: "plural" },
              { ending: "ετε", person: "2nd", number: "plural" },
              { ending: "ουσι(ν)", person: "3rd", number: "plural" },
            ],
            middle: [
              { ending: "ῶμαι", person: "1st", number: "singular" },  // For contract verbs in -ωμαι
              { ending: "ῃ", person: "2nd", number: "singular" },
              { ending: "εται", person: "3rd", number: "singular" },
              { ending: "ομεθα", person: "1st", number: "plural" },
              { ending: "εσθε", person: "2nd", number: "plural" },
              { ending: "ονται", person: "3rd", number: "plural" },
            ],
            passive: [] // Present passive = present middle
          }
        }
    }
  };  
  
  export const infinitiveEndings = {
    present: {
      active: [{ ending: "ειν" }],
      middle: [{ ending: "εσθαι" }],
      passive: [{ ending: "εσθαι" }]
    },
    future: {
      active: [{ ending: "σειν" }],
      middle: [{ ending: "σεσθαι" }],
      passive: [{ ending: "θησεσθαι" }]
    },
    aorist: {
      active: [{ ending: "σαι" }],
      middle: [{ ending: "σασθαι" }],
      passive: [{ ending: "θηναι" }]
    },
    perfect: {
      active: [{ ending: "κεναι" }],
      middle: [{ ending: "σθαι" }],
      passive: [{ ending: "σθαι" }]
    }
  };
  
  export const participleEndings = {
    present: {
      active: ["ων", "ουσα", "ον"],
      middle: ["ομενος", "ομενη", "ομενον"],
      passive: ["ομενος", "ομενη", "ομενον"]
    },
    future: {
      active: ["σων", "σουσα", "σον"],
      middle: ["σομενος", "σομενη", "σομενον"],
      passive: ["θησομενος", "θησομενη", "θησομενον"]
    },
    aorist: {
      active: ["σας", "σασα", "σαν"],
      middle: ["σαμενος", "σαμενη", "σαμενον"],
      passive: ["θεις", "θεισα", "θεν"]
    },
    perfect: {
      active: ["κως", "κυια", "κος"],
      middle: ["μενος", "μενη", "μενον"],
      passive: ["μενος", "μενη", "μενον"]
    }
  };
  