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
        passive: [] // present passive = present middle in Greek
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

// --- Aorist System ---
    aorist: {
        indicative: {
          active: [
            { ending: "σα", person: "1st", number: "singular" },
            { ending: "σας", person: "2nd", number: "singular" },
            { ending: "σε(ν)", person: "3rd", number: "singular" },
            { ending: "σαμεν", person: "1st", number: "plural" },
            { ending: "σατε", person: "2nd", number: "plural" },
            { ending: "σαν", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "σαμην", person: "1st", number: "singular" },
            { ending: "σω", person: "2nd", number: "singular" },
            { ending: "σατο", person: "3rd", number: "singular" },
            { ending: "σαμεθα", person: "1st", number: "plural" },
            { ending: "σασθε", person: "2nd", number: "plural" },
            { ending: "σαντο", person: "3rd", number: "plural" },
          ],
          passive: [
            { ending: "θην", person: "1st", number: "singular" },
            { ending: "θης", person: "2nd", number: "singular" },
            { ending: "θη", person: "3rd", number: "singular" },
            { ending: "θημεν", person: "1st", number: "plural" },
            { ending: "θητε", person: "2nd", number: "plural" },
            { ending: "θησαν", person: "3rd", number: "plural" },
          ]
        },
        subjunctive: {
          active: [
            { ending: "σω", person: "1st", number: "singular" },
            { ending: "σῃς", person: "2nd", number: "singular" },
            { ending: "σῃ", person: "3rd", number: "singular" },
            { ending: "σωμεν", person: "1st", number: "plural" },
            { ending: "σητε", person: "2nd", number: "plural" },
            { ending: "σωσι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "σωμαι", person: "1st", number: "singular" },
            { ending: "σῃ", person: "2nd", number: "singular" },
            { ending: "σηται", person: "3rd", number: "singular" },
            { ending: "σωμεθα", person: "1st", number: "plural" },
            { ending: "σησθε", person: "2nd", number: "plural" },
            { ending: "σωνται", person: "3rd", number: "plural" },
          ],
          passive: [
            { ending: "θω", person: "1st", number: "singular" },
            { ending: "θῃς", person: "2nd", number: "singular" },
            { ending: "θῃ", person: "3rd", number: "singular" },
            { ending: "θωμεν", person: "1st", number: "plural" },
            { ending: "θητε", person: "2nd", number: "plural" },
            { ending: "θωσι(ν)", person: "3rd", number: "plural" },
          ]
        },
        optative: {
          active: [
            { ending: "σαιμι", person: "1st", number: "singular" },
            { ending: "σειας / σαις", person: "2nd", number: "singular" },
            { ending: "σειε(ν) / σαι", person: "3rd", number: "singular" },
            { ending: "σαιμεν", person: "1st", number: "plural" },
            { ending: "σαιτε", person: "2nd", number: "plural" },
            { ending: "σειαν / σαιεν", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "σαιμην", person: "1st", number: "singular" },
            { ending: "σαιο", person: "2nd", number: "singular" },
            { ending: "σαιτο", person: "3rd", number: "singular" },
            { ending: "σαιμεθα", person: "1st", number: "plural" },
            { ending: "σαισθε", person: "2nd", number: "plural" },
            { ending: "σαιντο", person: "3rd", number: "plural" },
          ],
          passive: [
            { ending: "θειην", person: "1st", number: "singular" },
            { ending: "θειης", person: "2nd", number: "singular" },
            { ending: "θειη", person: "3rd", number: "singular" },
            { ending: "θειμεν", person: "1st", number: "plural" },
            { ending: "θειτε", person: "2nd", number: "plural" },
            { ending: "θειεν", person: "3rd", number: "plural" },
          ]
        },
        imperative: {
          active: [
            { ending: "ον", person: "2nd", number: "singular" },
            { ending: "ατω", person: "3rd", number: "singular" },
            { ending: "ατε", person: "2nd", number: "plural" },
            { ending: "αντων", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "αι", person: "2nd", number: "singular" },
            { ending: "ασθω", person: "3rd", number: "singular" },
            { ending: "ασθε", person: "2nd", number: "plural" },
            { ending: "ασθων", person: "3rd", number: "plural" },
          ],
          passive: [
            { ending: "θητι", person: "2nd", number: "singular" },
            { ending: "θητω", person: "3rd", number: "singular" },
            { ending: "θητε", person: "2nd", number: "plural" },
            { ending: "θεντων", person: "3rd", number: "plural" },
          ]
        }
    },

// --- Perfect System ---
    perfect: {
        indicative: {
          active: [
            { ending: "κα", person: "1st", number: "singular" },
            { ending: "κας", person: "2nd", number: "singular" },
            { ending: "κε(ν)", person: "3rd", number: "singular" },
            { ending: "καμεν", person: "1st", number: "plural" },
            { ending: "κατε", person: "2nd", number: "plural" },
            { ending: "κασι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "μαι", person: "1st", number: "singular" },
            { ending: "σαι", person: "2nd", number: "singular" },
            { ending: "ται", person: "3rd", number: "singular" },
            { ending: "μεθα", person: "1st", number: "plural" },
            { ending: "σθε", person: "2nd", number: "plural" },
            { ending: "νται", person: "3rd", number: "plural" },
          ],
          passive: [
            { ending: "μαι", person: "1st", number: "singular" },
            { ending: "σαι", person: "2nd", number: "singular" },
            { ending: "ται", person: "3rd", number: "singular" },
            { ending: "μεθα", person: "1st", number: "plural" },
            { ending: "σθε", person: "2nd", number: "plural" },
            { ending: "νται", person: "3rd", number: "plural" },
          ]
        },
        subjunctive: {
          active: [
            { ending: "κω", person: "1st", number: "singular" },
            { ending: "κῃς", person: "2nd", number: "singular" },
            { ending: "κῃ", person: "3rd", number: "singular" },
            { ending: "κωμεν", person: "1st", number: "plural" },
            { ending: "κητε", person: "2nd", number: "plural" },
            { ending: "κωσι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [],
          passive: []
        },
        optative: {
          active: [
            { ending: "κοιμι", person: "1st", number: "singular" },
            { ending: "κοις", person: "2nd", number: "singular" },
            { ending: "κοι", person: "3rd", number: "singular" },
            { ending: "κοιμεν", person: "1st", number: "plural" },
            { ending: "κοιτε", person: "2nd", number: "plural" },
            { ending: "κοιεν", person: "3rd", number: "plural" },
          ],
          middle: [],
          passive: []
        },
        imperative: {
          active: [
            { ending: "κε", person: "2nd", number: "singular" },
            { ending: "κετω", person: "3rd", number: "singular" },
            { ending: "κετε", person: "2nd", number: "plural" },
            { ending: "κετον", person: "3rd", number: "plural" },
          ],
          middle: [],
          passive: []
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
export const participleDeclensions = {
    present: {
      active: {
        masculine: {
          nominative: "ων",
          genitive: "οντος",
          dative: "οντι",
          accusative: "οντα",
          vocative: "ων"
        },
        feminine: {
          nominative: "ουσα",
          genitive: "ουσης",
          dative: "ουσῃ",
          accusative: "ουσαν",
          vocative: "ουσα"
        },
        neuter: {
          nominative: "ον",
          genitive: "οντος",
          dative: "οντι",
          accusative: "ον",
          vocative: "ον"
        }
      },
      middle: {
        masculine: {
          nominative: "ομενος",
          genitive: "ομενου",
          dative: "ομενῳ",
          accusative: "ομενον",
          vocative: "ομενε"
        },
        feminine: {
          nominative: "ομενη",
          genitive: "ομενης",
          dative: "ομενῃ",
          accusative: "ομενην",
          vocative: "ομενη"
        },
        neuter: {
          nominative: "ομενον",
          genitive: "ομενου",
          dative: "ομενῳ",
          accusative: "ομενον",
          vocative: "ομενον"
        }
      }
      // Passive is identical to middle in present
    },
    // aorist, future, perfect need similar blocks
  };
  

export const contractVerbEndings = {
    alphaContract: {
      present: {
        indicative: {
          active: [
            { ending: "ῶ", person: "1st", number: "singular" },
            { ending: "ᾷς", person: "2nd", number: "singular" },
            { ending: "ᾷ", person: "3rd", number: "singular" },
            { ending: "ῶμεν", person: "1st", number: "plural" },
            { ending: "ᾶτε", person: "2nd", number: "plural" },
            { ending: "ῶσι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "ῶμαι", person: "1st", number: "singular" },
            { ending: "ᾷ", person: "2nd", number: "singular" },
            { ending: "ᾶται", person: "3rd", number: "singular" },
            { ending: "ώμεθα", person: "1st", number: "plural" },
            { ending: "ᾶσθε", person: "2nd", number: "plural" },
            { ending: "ῶνται", person: "3rd", number: "plural" },
          ]
        }
      }
    },
    epsilonContract: {
      present: {
        indicative: {
          active: [
            { ending: "ῶ", person: "1st", number: "singular" },
            { ending: "εῖς", person: "2nd", number: "singular" },
            { ending: "εῖ", person: "3rd", number: "singular" },
            { ending: "οῦμεν", person: "1st", number: "plural" },
            { ending: "εῖτε", person: "2nd", number: "plural" },
            { ending: "οῦσι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "οῦμαι", person: "1st", number: "singular" },
            { ending: "ῇ", person: "2nd", number: "singular" },
            { ending: "εῖται", person: "3rd", number: "singular" },
            { ending: "οῦμεθα", person: "1st", number: "plural" },
            { ending: "εῖσθε", person: "2nd", number: "plural" },
            { ending: "οῦνται", person: "3rd", number: "plural" },
          ]
        }
      }
    },
    omicronContract: {
      present: {
        indicative: {
          active: [
            { ending: "ῶ", person: "1st", number: "singular" },
            { ending: "οῖς", person: "2nd", number: "singular" },
            { ending: "οῖ", person: "3rd", number: "singular" },
            { ending: "οῦμεν", person: "1st", number: "plural" },
            { ending: "οῦτε", person: "2nd", number: "plural" },
            { ending: "οῦσι(ν)", person: "3rd", number: "plural" },
          ],
          middle: [
            { ending: "οῦμαι", person: "1st", number: "singular" },
            { ending: "οῖ", person: "2nd", number: "singular" },
            { ending: "οῦται", person: "3rd", number: "singular" },
            { ending: "ούμεθα", person: "1st", number: "plural" },
            { ending: "οῦσθε", person: "2nd", number: "plural" },
            { ending: "οῦνται", person: "3rd", number: "plural" },
          ]
        }
      }
    }
};

export const irregularVerbRoots = {
    "ἔρχομαι": {
      presentRoot: "ερχ",
      futureRoot: "ελευθ",
      aoristRoot: "ελθ",
      perfectRoot: "εληλυθ",
      perfectMiddleRoot: "εληλυθ",
      aoristPassiveRoot: ""
    },
    "λαμβάνω": {
      presentRoot: "λαμβαν",
      futureRoot: "ληψ",
      aoristRoot: "λαβ",
      perfectRoot: "ειληφ",
      perfectMiddleRoot: "ειλημ",
      aoristPassiveRoot: "λημφθ"
    },
    "λέγω": {
      presentRoot: "λεγ",
      futureRoot: "ἐρ",
      aoristRoot: "ειπ",
      perfectRoot: "ειρηκ",
      perfectMiddleRoot: "ειρημ",
      aoristPassiveRoot: "ῥηθ"
    },
    // ... expand with more key verbs
};
  
  
  
  