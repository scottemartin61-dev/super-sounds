// =====================================================================
//  WORD LISTS — edit freely!
//
//  Each sound has a list of levels. Each level has items:
//    { w: "word shown", p: "emoji picture" }
//  Optional item fields:
//    say:  spelling for the voice if it mispronounces w
//    pair, pp: a "before" word and picture for word pairs
//              (e.g. toe 🦶 ➜ toad 🐸) — the voice says both
//    hl:   for "Endings" sentences, which words to highlight the end of
//
//  Sound fields: on = shown on the home screen by default,
//                level = the level it starts on.
//  Ask his speech therapist which sounds/levels to practise.
// =====================================================================

const lvl = (id, name, hint, items) => ({ id, name, hint, items });

window.SOUNDS = {
  // ------------------------------------------------------------------
  END: {
    label: "Endings",
    cue: "🐕",
    cueText: "Don't forget the tail!",
    color: "#ffe29a",
    dark: "#9a6b00",
    highlight: "ending",
    on: true,
    level: "pairs",
    tip:
      "This is for dropping the last sound of a word (\"wa\" for \"watch\"). " +
      "Call the last sound the word's \"tail\" — don't let the doggy lose its tail! " +
      "Say the word slowly and stretch or tap the last sound: \"boa-T\". " +
      "Word pairs show how the tail changes the meaning: toe vs toaD. " +
      "Only judge the ending — it's fine if other sounds aren't perfect.",
    levels: [
      lvl("pairs", "Word pairs", "toe → toad, bow → boat", [
        { pair: "toe", pp: "🦶", w: "toad", p: "🐸" },
        { pair: "two", pp: "2️⃣", w: "tooth", p: "🦷" },
        { pair: "sea", pp: "🌊", w: "seat", p: "🪑" },
        { pair: "bow", pp: "🎀", w: "boat", p: "⛵" },
        { pair: "no", pp: "🙅", w: "nose", p: "👃" },
        { pair: "row", pp: "🚣", w: "rope", p: "🪢" },
        { pair: "me", pp: "🙋", w: "meat", p: "🍖" },
        { pair: "pea", pp: "🫛", w: "peach", p: "🍑" },
        { pair: "bee", pp: "🐝", w: "beach", p: "🏖️" },
        { pair: "bye", pp: "👋", w: "bike", p: "🚲" },
      ]),
      lvl("words", "Short words", "cat, dog, bus", [
        { w: "cat", p: "🐱" },
        { w: "dog", p: "🐶" },
        { w: "bus", p: "🚌" },
        { w: "cup", p: "☕" },
        { w: "hat", p: "🎩" },
        { w: "bed", p: "🛏️" },
        { w: "duck", p: "🦆" },
        { w: "fish", p: "🐟" },
        { w: "book", p: "📖" },
        { w: "sock", p: "🧦" },
        { w: "boat", p: "⛵" },
        { w: "cake", p: "🎂" },
        { w: "kite", p: "🪁" },
        { w: "pig", p: "🐷" },
        { w: "sun", p: "☀️" },
        { w: "watch", p: "⌚" },
      ]),
      lvl("longer", "Longer words", "rocket, basket", [
        { w: "rocket", p: "🚀" },
        { w: "robot", p: "🤖" },
        { w: "carrot", p: "🥕" },
        { w: "jacket", p: "🧥" },
        { w: "basket", p: "🧺" },
        { w: "pumpkin", p: "🎃" },
        { w: "chicken", p: "🐔" },
        { w: "magnet", p: "🧲" },
        { w: "peanut", p: "🥜" },
        { w: "octopus", p: "🐙" },
        { w: "sandwich", p: "🥪" },
      ]),
      lvl("sentences", "Short sentences", "I see a cat.", [
        { w: "I see a cat.", p: "🐱", hl: ["cat"] },
        { w: "The dog is big.", p: "🐶", hl: ["dog", "big"] },
        { w: "Get on the bus!", p: "🚌", hl: ["get", "bus"] },
        { w: "A duck in a boat.", p: "🦆⛵", hl: ["duck", "boat"] },
        { w: "I like cake.", p: "🎂", hl: ["like", "cake"] },
        { w: "Look at my watch.", p: "⌚", hl: ["look", "watch"] },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  L: {
    label: "L",
    cue: "🎵",
    cueText: "Sing it: la la la!",
    color: "#cdb4db",
    dark: "#7b4f99",
    highlight: /l+/gi,
    on: true,
    level: "start",
    tip:
      "Tongue tip goes UP to the bumpy spot just behind the top teeth, then drops: \"la la la\". " +
      "Sing it! Use a mirror so he can see his tongue lift. " +
      "If it comes out as \"w\" or \"y\", touch the bumpy spot with a lollipop or spoon so he can feel where the tongue goes. " +
      "For blends (blue, clock), say them slowly at first: \"buh-lue\" → \"blue\".",
    levels: [
      lvl("syllables", "Just the sound", "la, lee, loo", [
        { w: "la", say: "lah", p: "🎵" },
        { w: "lee", p: "🎵" },
        { w: "lo", say: "low", p: "🎵" },
        { w: "loo", p: "🎵" },
        { w: "lay", p: "🎵" },
        { w: "la la la", p: "🎵" },
      ]),
      lvl("start", "Start of words", "lion, leaf", [
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
      ]),
      lvl("middle", "Middle of words", "balloon, yellow", [
        { w: "balloon", p: "🎈" },
        { w: "yellow", p: "💛" },
        { w: "hello", p: "👋" },
        { w: "melon", p: "🍈" },
        { w: "koala", p: "🐨" },
        { w: "elephant", p: "🐘" },
        { w: "sailboat", p: "⛵" },
        { w: "helicopter", p: "🚁" },
        { w: "jellyfish", p: "🪼" },
      ]),
      lvl("end", "End of words", "ball, bell", [
        { w: "ball", p: "⚽" },
        { w: "bell", p: "🔔" },
        { w: "apple", p: "🍎" },
        { w: "owl", p: "🦉" },
        { w: "snail", p: "🐌" },
        { w: "whale", p: "🐳" },
        { w: "school", p: "🏫" },
        { w: "pencil", p: "✏️" },
        { w: "turtle", p: "🐢" },
        { w: "shell", p: "🐚" },
      ]),
      lvl("blends", "L-blends", "blue, clock, flag", [
        { w: "blue", p: "💙" },
        { w: "black", p: "🖤" },
        { w: "block", p: "🧱" },
        { w: "clock", p: "🕐" },
        { w: "cloud", p: "☁️" },
        { w: "clap", p: "👏" },
        { w: "flower", p: "🌸" },
        { w: "flag", p: "🚩" },
        { w: "fly", p: "🪰" },
        { w: "glove", p: "🧤" },
        { w: "glass", p: "🥛" },
        { w: "plane", p: "✈️" },
        { w: "plate", p: "🍽️" },
        { w: "sleep", p: "😴" },
        { w: "slide", p: "🛝" },
      ]),
      lvl("sentences", "Silly sentences", "The lion likes lemons.", [
        { w: "The lion likes lemons.", p: "🦁🍋" },
        { w: "I have a yellow balloon.", p: "🎈" },
        { w: "The ball fell down.", p: "⚽" },
        { w: "A blue plane can fly.", p: "✈️" },
        { w: "Clap for the clock!", p: "👏🕐" },
        { w: "The ladybug is on a leaf.", p: "🐞🍃" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  SH: {
    label: "SH",
    cue: "🌊",
    cueText: "Ocean waves: shhh!",
    color: "#c5e3a8",
    dark: "#4f7a28",
    highlight: /sh/gi,
    on: true,
    level: "start",
    tip:
      "Lips push forward into a little circle (like a kiss), teeth close together, and blow: \"shhh\" like ocean waves. " +
      "If it sounds like \"s\", push the lips further forward and pull the tongue back a little. " +
      "Practise the long \"shhh\" first, then add a vowel: \"shhh-oe\" → \"shoe\".",
    levels: [
      lvl("syllables", "Just the sound", "sha, shoe, shee", [
        { w: "shhh", p: "🌊" },
        { w: "sha", say: "shah", p: "🌊" },
        { w: "shee", p: "🌊" },
        { w: "sho", say: "show", p: "🌊" },
        { w: "shoo", p: "🌊" },
        { w: "shay", p: "🌊" },
      ]),
      lvl("start", "Start of words", "ship, shoe", [
        { w: "ship", p: "🚢" },
        { w: "shoe", p: "👟" },
        { w: "shell", p: "🐚" },
        { w: "sheep", p: "🐑" },
        { w: "shark", p: "🦈" },
        { w: "shirt", p: "👕" },
        { w: "shorts", p: "🩳" },
        { w: "shower", p: "🚿" },
        { w: "shield", p: "🛡️" },
      ]),
      lvl("middle", "Middle of words", "fishing, mushroom", [
        { w: "fishing", p: "🎣" },
        { w: "seashell", p: "🐚" },
        { w: "mushroom", p: "🍄" },
        { w: "dishes", p: "🍽️" },
        { w: "brushing", p: "🪥" },
        { w: "washing", p: "🧼" },
      ]),
      lvl("end", "End of words", "fish, brush", [
        { w: "fish", p: "🐟" },
        { w: "dish", p: "🍽️" },
        { w: "brush", p: "🪥" },
        { w: "wash", p: "🧼" },
        { w: "bush", p: "🌳" },
        { w: "splash", p: "💦" },
        { w: "trash", p: "🗑️" },
        { w: "cash", p: "💵" },
      ]),
      lvl("sentences", "Silly sentences", "Wash the dish.", [
        { w: "The sheep has a shell.", p: "🐑🐚" },
        { w: "Wash the dish.", p: "🧼🍽️" },
        { w: "A fish and a shark!", p: "🐟🦈" },
        { w: "Shoes on my feet.", p: "👟" },
        { w: "Brush, brush, brush!", p: "🪥" },
        { w: "Splash in the shower!", p: "🚿" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  V: {
    label: "V",
    cue: "🏎️",
    cueText: "Race car: vvvroom!",
    color: "#ffc9a3",
    dark: "#b35c1e",
    highlight: /v/gi,
    on: true,
    level: "start",
    tip:
      "Top teeth rest gently on the bottom lip, then turn the voice on: \"vvvv\" — a buzzy \"f\". " +
      "He should feel his lip tickle. If it comes out as \"b\" (lips together), show him in a mirror that the teeth touch the lip instead. " +
      "If it comes out as \"f\", put his hand on his throat to feel the buzz.",
    levels: [
      lvl("syllables", "Just the sound", "va, vee, vroom", [
        { w: "vvvroom", say: "vroom", p: "🏎️" },
        { w: "va", say: "vah", p: "🏎️" },
        { w: "vee", p: "🏎️" },
        { w: "vo", say: "voe", p: "🏎️" },
        { w: "voo", p: "🏎️" },
        { w: "vay", p: "🏎️" },
      ]),
      lvl("start", "Start of words", "van, vase", [
        { w: "van", p: "🚐" },
        { w: "vase", p: "🏺" },
        { w: "violin", p: "🎻" },
        { w: "volcano", p: "🌋" },
        { w: "vest", p: "🦺" },
        { w: "vegetables", p: "🥦" },
        { w: "volleyball", p: "🏐" },
        { w: "vampire", p: "🧛" },
      ]),
      lvl("middle", "Middle of words", "seven, river", [
        { w: "seven", p: "7️⃣" },
        { w: "TV", say: "T V", p: "📺" },
        { w: "river", p: "🏞️" },
        { w: "diving", p: "🤿" },
        { w: "driving", p: "🚗" },
        { w: "waving", p: "👋" },
        { w: "beaver", p: "🦫" },
      ]),
      lvl("end", "End of words", "five, glove", [
        { w: "five", p: "5️⃣" },
        { w: "glove", p: "🧤" },
        { w: "dove", p: "🕊️" },
        { w: "wave", p: "🌊" },
        { w: "olive", p: "🫒" },
        { w: "love", p: "❤️" },
        { w: "drive", p: "🚙" },
      ]),
      lvl("sentences", "Silly sentences", "Five vans go vroom!", [
        { w: "Five vans go vroom!", p: "🚐" },
        { w: "I love my glove.", p: "🧤" },
        { w: "A violin in a van.", p: "🎻🚐" },
        { w: "Wave to the dove.", p: "👋🕊️" },
        { w: "Seven vegetables!", p: "🥦" },
        { w: "The volcano is very big.", p: "🌋" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  G: {
    label: "G",
    cue: "🐸",
    cueText: "Frog gulp: g-g-g!",
    color: "#b9d6f2",
    dark: "#2d6aa3",
    highlight: /g+/gi,
    on: true,
    level: "start",
    tip:
      "G and K are made the same way — the back of the tongue pushes up — but G has the voice ON. " +
      "Put his hand on your throat: G buzzes, K doesn't. Gulp like a frog: \"g-g-g\". " +
      "The \"K or G\" pairs (coat / goat) show that the buzz changes the word.",
    levels: [
      lvl("syllables", "Just the sound", "ga, go, goo", [
        { w: "g-g-g", say: "guh, guh, guh", p: "🐸" },
        { w: "ga", say: "gah", p: "🐸" },
        { w: "gee", say: "ghee", p: "🐸" },
        { w: "go", p: "🐸" },
        { w: "goo", p: "🐸" },
        { w: "gulp", p: "🐸" },
      ]),
      lvl("pairs", "K or G?", "coat → goat", [
        { pair: "coat", pp: "🧥", w: "goat", p: "🐐" },
        { pair: "cold", pp: "🥶", w: "gold", p: "🥇" },
        { pair: "crow", pp: "🐦‍⬛", w: "grow", p: "🌱" },
        { pair: "pick", pp: "⛏️", w: "pig", p: "🐷" },
        { pair: "back", pp: "🔙", w: "bag", p: "👜" },
      ]),
      lvl("start", "Start of words", "goat, gift", [
        { w: "goat", p: "🐐" },
        { w: "girl", p: "👧" },
        { w: "gift", p: "🎁" },
        { w: "game", p: "🎮" },
        { w: "ghost", p: "👻" },
        { w: "gorilla", p: "🦍" },
        { w: "guitar", p: "🎸" },
        { w: "goose", p: "🪿" },
        { w: "gold", p: "🥇" },
      ]),
      lvl("middle", "Middle of words", "tiger, dragon", [
        { w: "tiger", p: "🐯" },
        { w: "dragon", p: "🐉" },
        { w: "kangaroo", p: "🦘" },
        { w: "spaghetti", p: "🍝" },
        { w: "eagle", p: "🦅" },
        { w: "bagel", p: "🥯" },
        { w: "alligator", p: "🐊" },
      ]),
      lvl("end", "End of words", "pig, frog", [
        { w: "pig", p: "🐷" },
        { w: "bag", p: "👜" },
        { w: "dog", p: "🐶" },
        { w: "frog", p: "🐸" },
        { w: "bug", p: "🐛" },
        { w: "egg", p: "🥚" },
        { w: "leg", p: "🦵" },
        { w: "flag", p: "🚩" },
        { w: "hug", p: "🤗" },
        { w: "log", p: "🪵" },
      ]),
      lvl("sentences", "Silly sentences", "The goat has a gift.", [
        { w: "The goat has a gift.", p: "🐐🎁" },
        { w: "A big dog and a frog.", p: "🐶🐸" },
        { w: "Give me a hug!", p: "🤗" },
        { w: "The bug is on the log.", p: "🐛🪵" },
        { w: "Go, go, go!", p: "🟢" },
        { w: "A ghost in the garden.", p: "👻" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  R: {
    label: "R",
    cue: "🐯",
    cueText: "Growl like a tiger: grrr!",
    color: "#ffb4a2",
    dark: "#c8553d",
    highlight: /r+/gi,
    on: false,
    level: "start",
    tip:
      "Growl like a tiger: \"grrr\". The tongue pulls back and bunches up; " +
      "lips are only a little rounded (pushing the lips forward turns it into a \"w\"). " +
      "Try sliding from \"grrr\" into the word: \"grrr-rabbit\". Practise in a mirror. " +
      "R is one of the last sounds children master (often 6–7 years), so keep it light.",
    levels: [
      lvl("syllables", "Just the sound", "ra, ree, roo", [
        { w: "ra", say: "rah", p: "🐯" },
        { w: "ree", p: "🐯" },
        { w: "ro", say: "row", p: "🐯" },
        { w: "roo", p: "🐯" },
        { w: "ray", p: "🐯" },
        { w: "grrr", p: "🐯" },
      ]),
      lvl("start", "Start of words", "rabbit, rocket", [
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
      ]),
      lvl("middle", "Middle of words", "carrot, parrot", [
        { w: "carrot", p: "🥕" },
        { w: "parrot", p: "🦜" },
        { w: "giraffe", p: "🦒" },
        { w: "pirate", p: "🏴‍☠️" },
        { w: "zero", p: "0️⃣" },
        { w: "arrow", p: "🏹" },
        { w: "orange", p: "🍊" },
      ]),
      lvl("end", "End of words", "car, star", [
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
      ]),
      lvl("sentences", "Silly sentences", "I see a rainbow.", [
        { w: "The red rocket goes up!", p: "🚀" },
        { w: "A rabbit eats a carrot.", p: "🐰🥕" },
        { w: "I see a rainbow.", p: "🌈" },
        { w: "The bear is in the car.", p: "🐻🚗" },
        { w: "The robot can run!", p: "🤖" },
        { w: "Roar like a tiger!", p: "🐯" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  CH: {
    label: "CH",
    cue: "🚂",
    cueText: "Train sound: choo-choo!",
    color: "#a8dadc",
    dark: "#2a7f84",
    highlight: /t?ch/gi,
    on: false,
    level: "start",
    tip:
      "Make the train sound \"choo-choo\". CH is a \"t\" that slides into \"sh\": " +
      "say \"t\" then \"sh\" faster and faster until they join (t-sh → ch). " +
      "Lips push forward a little, like a kiss. A short, popping sound — not a long \"shhh\".",
    levels: [
      lvl("syllables", "Just the sound", "cha, chee, choo", [
        { w: "cha", say: "chah", p: "🚂" },
        { w: "chee", p: "🚂" },
        { w: "cho", p: "🚂" },
        { w: "choo", p: "🚂" },
        { w: "chay", p: "🚂" },
        { w: "choo-choo", p: "🚂" },
      ]),
      lvl("start", "Start of words", "chair, cheese", [
        { w: "chair", p: "🪑" },
        { w: "cheese", p: "🧀" },
        { w: "chick", p: "🐤" },
        { w: "cherry", p: "🍒" },
        { w: "chicken", p: "🐔" },
        { w: "chocolate", p: "🍫" },
        { w: "chips", p: "🍟" },
        { w: "choo-choo", p: "🚂" },
      ]),
      lvl("middle", "Middle of words", "peaches, teacher", [
        { w: "peaches", p: "🍑" },
        { w: "beaches", p: "🏖️" },
        { w: "teacher", p: "🧑‍🏫" },
        { w: "lunchbox", p: "🍱" },
        { w: "sandwiches", p: "🥪" },
        { w: "kitchen", p: "🍳" },
        { w: "hatching", p: "🐣" },
      ]),
      lvl("end", "End of words", "watch, peach", [
        { w: "watch", p: "⌚" },
        { w: "peach", p: "🍑" },
        { w: "beach", p: "🏖️" },
        { w: "couch", p: "🛋️" },
        { w: "lunch", p: "🍱" },
        { w: "witch", p: "🧙" },
        { w: "sandwich", p: "🥪" },
        { w: "ouch", p: "🤕" },
      ]),
      lvl("sentences", "Silly sentences", "A peach for lunch.", [
        { w: "The chick eats cheese.", p: "🐤🧀" },
        { w: "I sit on a chair.", p: "🪑" },
        { w: "Choo-choo goes the train!", p: "🚂" },
        { w: "A peach for lunch.", p: "🍑" },
        { w: "Chocolate chips, yum!", p: "🍫" },
        { w: "Watch the chicken!", p: "🐔" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  TH: {
    label: "TH",
    cue: "👅",
    cueText: "Tongue peeks out: th!",
    color: "#f5c2d9",
    dark: "#a3466f",
    highlight: /th/gi,
    on: false,
    level: "start",
    tip:
      "The tongue tip peeks out between the teeth and air blows over it: \"th\". " +
      "Saying \"d\" or \"f\" instead is normal for many children until about 7–8, so keep this playful. " +
      "Silly faces in a mirror help: \"Can you show me your tongue and blow?\"",
    levels: [
      lvl("start", "Start of words", "thumb, three", [
        { w: "thumb", p: "👍" },
        { w: "three", p: "3️⃣" },
        { w: "think", p: "🤔" },
        { w: "thunder", p: "⛈️" },
        { w: "thank you", p: "🙏" },
        { w: "thirsty", p: "🥤" },
      ]),
      lvl("voiced", "This & that", "this, that, mother", [
        { w: "this", p: "👉" },
        { w: "that", p: "👈" },
        { w: "mother", p: "👩" },
        { w: "brother", p: "👦" },
        { w: "feather", p: "🪶" },
        { w: "the", say: "thuh", p: "🔤" },
      ]),
      lvl("end", "End of words", "bath, tooth", [
        { w: "bath", p: "🛁" },
        { w: "tooth", p: "🦷" },
        { w: "mouth", p: "👄" },
        { w: "teeth", p: "🦷" },
        { w: "math", p: "➕" },
      ]),
      lvl("sentences", "Silly sentences", "Three thumbs up!", [
        { w: "Three thumbs up!", p: "👍" },
        { w: "Thank you, mother.", p: "🙏" },
        { w: "Brush your teeth.", p: "🦷" },
        { w: "This is a feather.", p: "🪶" },
      ]),
    ],
  },

  // ------------------------------------------------------------------
  SB: {
    label: "S-blends",
    cue: "🐍",
    cueText: "Snake first: sss-top!",
    color: "#ddd5c4",
    dark: "#6b5d45",
    highlight: /s[ptkcmnlw]/gi,
    on: false,
    level: "start",
    tip:
      "Start with a long snake \"sss\" and then add the rest: \"sss-top\" → \"stop\". " +
      "Dropping the s (\"top\" for \"stop\") is normal for many children until about 7–8, so keep it light.",
    levels: [
      lvl("start", "Start of words", "spoon, star, snake", [
        { w: "spoon", p: "🥄" },
        { w: "spider", p: "🕷️" },
        { w: "star", p: "⭐" },
        { w: "stop", p: "🛑" },
        { w: "snake", p: "🐍" },
        { w: "snail", p: "🐌" },
        { w: "snow", p: "❄️" },
        { w: "smile", p: "😊" },
        { w: "sleep", p: "😴" },
        { w: "swim", p: "🏊" },
        { w: "skate", p: "⛸️" },
        { w: "school", p: "🏫" },
      ]),
      lvl("end", "End of words", "nest, mask", [
        { w: "nest", p: "🪺" },
        { w: "fist", p: "✊" },
        { w: "mask", p: "🎭" },
        { w: "toast", p: "🍞" },
        { w: "ghost", p: "👻" },
      ]),
      lvl("sentences", "Silly sentences", "Stop, snake!", [
        { w: "Stop, snake!", p: "🛑🐍" },
        { w: "A star in the sky.", p: "⭐" },
        { w: "The snail is slow.", p: "🐌" },
        { w: "Smile and swim!", p: "😊🏊" },
      ]),
    ],
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
    stickers: emojiList("🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🐞🦋🐢🐙🦀🐠🐬🐳🦒🦓🐘🦛🦘🦥🦦🦔🦩"),
  },
  dinos: {
    name: "Dinosaurs",
    mascot: "🦖",
    stickers: emojiList("🦖🦕🐊🦎🐢🐉🐲🥚🦴🌋🌴🌿🪺🐍🦤🦣🦏🪸🌊☄️🪨🍃🌺🐚"),
  },
  vehicles: {
    name: "Trains & trucks",
    mascot: "🚂",
    stickers: emojiList("🚂🚃🚄🚅🚆🚇🚈🚊🚝🚞🚋🚌🚎🚐🚑🚒🚓🚕🚗🚙🛻🚚🚛🚜🏎️🏍️🛵🚲🛴🚁🛩️✈️🚀🛸🚤⛵🚢🛶"),
  },
  space: {
    name: "Space",
    mascot: "🚀",
    stickers: emojiList("🚀🛸🌍🌎🌏🌕🌖🌗🌘🌑🌒🌓🌔🌙⭐🌟✨☄️🪐🌌👽🛰️🔭🌞"),
  },
};
