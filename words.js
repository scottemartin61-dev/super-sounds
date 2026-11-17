// =====================================================================
//  WORD LISTS — edit freely!
//  Each item:  { w: "word shown", p: "emoji picture", say: "optional
//  spelling for the voice if it mispronounces w" }
//  Ask his speech therapist which sounds/positions to practise and
//  adjust these lists to match.
// =====================================================================

window.LEVELS = [
  { id: "syllables", name: "Just the sound", hint: "Sound + vowel, e.g. ra, ree" },
  { id: "start",     name: "Start of words", hint: "rabbit, chair, lion" },
  { id: "middle",    name: "Middle of words", hint: "carrot, peaches, balloon" },
  { id: "end",       name: "End of words",   hint: "car, watch, ball" },
  { id: "sentences", name: "Silly sentences", hint: "Short phrases" },
];

window.SOUNDS = {
  R: {
    label: "R",
    cue: "🐯",
    cueText: "Growl like a tiger: grrr!",
    color: "#ffb4a2",
    dark: "#c8553d",
    highlight: /r+/gi,
    tip:
      "Growl like a tiger: \"grrr\". The tongue pulls back and bunches up; " +
      "lips are only a little rounded (pushing the lips forward turns it into a \"w\"). " +
      "Try sliding from \"grrr\" into the word: \"grrr-rabbit\". Practise in a mirror.",
    levels: {
      syllables: [
        { w: "ra", say: "rah", p: "🐯" },
        { w: "ree", p: "🐯" },
        { w: "ro", say: "row", p: "🐯" },
        { w: "roo", p: "🐯" },
        { w: "ray", p: "🐯" },
        { w: "grrr", p: "🐯" },
      ],
      start: [
        { w: "rabbit", p: "🐰" },
        { w: "rain", p: "🌧️" },
        { w: "rocket", p: "🚀" },
        { w: "ring", p: "💍" },
        { w: "rose", p: "🌹" },
        { w: "robot", p: "🤖" },
        { w: "rainbow", p: "🌈" },
        { w: "rock", p: "🪨" },
        { w: "road", p: "🛣️" },
        { w: "rooster", p: "🐓" },
        { w: "raccoon", p: "🦝" },
        { w: "run", p: "🏃" },
      ],
      middle: [
        { w: "carrot", p: "🥕" },
        { w: "parrot", p: "🦜" },
        { w: "giraffe", p: "🦒" },
        { w: "pirate", p: "🏴‍☠️" },
        { w: "zero", p: "0️⃣" },
        { w: "arrow", p: "🏹" },
        { w: "orange", p: "🍊" },
        { w: "earring", p: "👂" },
      ],
      end: [
        { w: "car", p: "🚗" },
        { w: "star", p: "⭐" },
        { w: "door", p: "🚪" },
        { w: "bear", p: "🐻" },
        { w: "pear", p: "🍐" },
        { w: "deer", p: "🦌" },
        { w: "four", p: "4️⃣" },
        { w: "guitar", p: "🎸" },
        { w: "tiger", p: "🐯" },
        { w: "spider", p: "🕷️" },
        { w: "dinosaur", p: "🦕" },
        { w: "hammer", p: "🔨" },
      ],
      sentences: [
        { w: "The red rocket goes up!", p: "🚀" },
        { w: "A rabbit eats a carrot.", p: "🐰🥕" },
        { w: "I see a rainbow.", p: "🌈" },
        { w: "The bear is in the car.", p: "🐻🚗" },
        { w: "The robot can run!", p: "🤖" },
        { w: "Roar like a tiger!", p: "🐯" },
      ],
    },
  },

  CH: {
    label: "CH",
    cue: "🚂",
    cueText: "Train sound: choo-choo!",
    color: "#a8dadc",
    dark: "#2a7f84",
    highlight: /t?ch/gi,
    tip:
      "Make the train sound \"choo-choo\". CH is a \"t\" that slides into \"sh\": " +
      "say \"t\" then \"sh\" faster and faster until they join (t-sh → ch). " +
      "Lips push forward a little, like a kiss. A short, popping sound — not a long \"shhh\".",
    levels: {
      syllables: [
        { w: "cha", say: "chah", p: "🚂" },
        { w: "chee", p: "🚂" },
        { w: "cho", p: "🚂" },
        { w: "choo", p: "🚂" },
        { w: "chay", p: "🚂" },
        { w: "choo-choo", p: "🚂" },
      ],
      start: [
        { w: "chair", p: "🪑" },
        { w: "cheese", p: "🧀" },
        { w: "chick", p: "🐤" },
        { w: "cherry", p: "🍒" },
        { w: "chicken", p: "🐔" },
        { w: "chocolate", p: "🍫" },
        { w: "chips", p: "🍟" },
        { w: "choo-choo", p: "🚂" },
      ],
      middle: [
        { w: "peaches", p: "🍑" },
        { w: "beaches", p: "🏖️" },
        { w: "teacher", p: "🧑‍🏫" },
        { w: "lunchbox", p: "🍱" },
        { w: "sandwiches", p: "🥪" },
        { w: "kitchen", p: "🍳" },
        { w: "hatching", p: "🐣" },
      ],
      end: [
        { w: "watch", p: "⌚" },
        { w: "peach", p: "🍑" },
        { w: "beach", p: "🏖️" },
        { w: "couch", p: "🛋️" },
        { w: "lunch", p: "🍱" },
        { w: "witch", p: "🧙" },
        { w: "sandwich", p: "🥪" },
        { w: "ouch", p: "🤕" },
      ],
      sentences: [
        { w: "The chick eats cheese.", p: "🐤🧀" },
        { w: "I sit on a chair.", p: "🪑" },
        { w: "Choo-choo goes the train!", p: "🚂" },
        { w: "A peach for lunch.", p: "🍑" },
        { w: "Chocolate chips, yum!", p: "🍫" },
        { w: "Watch the chicken!", p: "🐔" },
      ],
    },
  },

  L: {
    label: "L",
    cue: "🎵",
    cueText: "Sing it: la la la!",
    color: "#cdb4db",
    dark: "#7b4f99",
    highlight: /l+/gi,
    tip:
      "Tongue tip goes UP to the bumpy spot just behind the top teeth, then drops: \"la la la\". " +
      "Sing it! Use a mirror so he can see his tongue lift. " +
      "If it comes out as \"w\" or \"y\", touch the bumpy spot with a lollipop or spoon so he can feel where the tongue goes.",
    levels: {
      syllables: [
        { w: "la", say: "lah", p: "🎵" },
        { w: "lee", p: "🎵" },
        { w: "lo", say: "low", p: "🎵" },
        { w: "loo", p: "🎵" },
        { w: "lay", p: "🎵" },
        { w: "la la la", p: "🎵" },
      ],
      start: [
        { w: "lion", p: "🦁" },
        { w: "leaf", p: "🍃" },
        { w: "lemon", p: "🍋" },
        { w: "light", p: "💡" },
        { w: "ladder", p: "🪜" },
        { w: "lollipop", p: "🍭" },
        { w: "lock", p: "🔒" },
        { w: "ladybug", p: "🐞" },
        { w: "leg", p: "🦵" },
        { w: "log", p: "🪵" },
      ],
      middle: [
        { w: "balloon", p: "🎈" },
        { w: "yellow", p: "💛" },
        { w: "hello", p: "👋" },
        { w: "melon", p: "🍈" },
        { w: "koala", p: "🐨" },
        { w: "elephant", p: "🐘" },
        { w: "sailboat", p: "⛵" },
        { w: "helicopter", p: "🚁" },
        { w: "jellyfish", p: "🪼" },
      ],
      end: [
        { w: "ball", p: "⚽" },
        { w: "bell", p: "🔔" },
        { w: "apple", p: "🍎" },
        { w: "owl", p: "🦉" },
        { w: "snail", p: "🐌" },
        { w: "whale", p: "🐳" },
        { w: "school", p: "🏫" },
        { w: "pencil", p: "✏️" },
        { w: "turtle", p: "🐢" },
        { w: "camel", p: "🐪" },
        { w: "shell", p: "🐚" },
      ],
      sentences: [
        { w: "The lion likes lemons.", p: "🦁🍋" },
        { w: "I have a yellow balloon.", p: "🎈" },
        { w: "The ball fell down.", p: "⚽" },
        { w: "Look at the little owl.", p: "🦉" },
        { w: "Lollipops are yummy!", p: "🍭" },
        { w: "The ladybug is on a leaf.", p: "🐞🍃" },
      ],
    },
  },
};

// Splits a string of emoji into single emoji (keeps multi-part emoji whole).
function emojiList(s) {
  if (window.Intl && Intl.Segmenter) {
    return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].map((x) => x.segment);
  }
  return Array.from(s.replace(/️/g, ""));
}

// Sticker collections — pick one in the Grown-ups area.
window.THEMES = {
  animals: {
    name: "Animals",
    mascot: "🐶",
    mascotName: "Pip",
    stickers: emojiList("🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🐞🦋🐢🐙🦀🐠🐬🐳🦒🦓🐘🦛🦘🦥🦦🦔🦩"),
  },
  dinos: {
    name: "Dinosaurs",
    mascot: "🦖",
    mascotName: "Rexy",
    stickers: emojiList("🦖🦕🐊🦎🐢🐉🐲🥚🦴🌋🌴🌿🪺🐍🦤🦣🦏🪸🌊☄️🪨🍃🌺🐚"),
  },
  vehicles: {
    name: "Trains & trucks",
    mascot: "🚂",
    mascotName: "Choo",
    stickers: emojiList("🚂🚃🚄🚅🚆🚇🚈🚊🚝🚞🚋🚌🚎🚐🚑🚒🚓🚕🚗🚙🛻🚚🚛🚜🏎️🏍️🛵🚲🛴🚁🛩️✈️🚀🛸🚤⛵🚢🛶"),
  },
  space: {
    name: "Space",
    mascot: "🚀",
    mascotName: "Zoom",
    stickers: emojiList("🚀🛸🌍🌎🌏🌕🌖🌗🌘🌑🌒🌓🌔🌙⭐🌟✨☄️🪐🌌👽🛰️🔭🌞"),
  },
};
