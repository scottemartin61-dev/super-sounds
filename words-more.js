// =====================================================================
//  MORE SOUNDS — all OFF by default. A grown-up turns them on in
//  Grown-ups → Sounds & levels. Same format as words.js.
//
//  group: which list the sound appears in on the Sounds & levels screen
//    early   = most children have these by about 3–4
//    middle  = usually by about 4–5
//    later   = usually by about 5–7 (some up to 8)
//    pattern = word patterns (endings, blends)
//  The ages are rough guides only — his speech therapist knows best.
// =====================================================================

(function () {
  const L = (id, name, hint, items) => ({ id, name, hint, items });

  Object.assign(window.SOUNDS, {
    // ------------------------------------------------------------------
    P: {
      label: "P", cue: "🍿", cueText: "Popcorn pops: p-p-p!",
      color: "#ffd1dc", dark: "#b0345a", highlight: /p(?!h)/gi, on: false, level: "start", group: "early",
      tip: "Lips close, then pop open with a puff of air: \"p-p-p\", like popcorn popping. " +
        "Hold a tissue in front of his mouth: P makes it move, B doesn't.",
      coach: { pic: "💋", how: "Lips together, then pop!", hint: "Popcorn: p-p-p 🍿", model: "p-p-p", modelSay: "puh, puh, puh" },
      levels: [
        L("syllables", "Just the sound", "pa, pea, pie", [
          { w: "p-p-p", say: "puh, puh, puh", p: "🍿" }, { w: "pa", say: "pah", p: "🍿" }, { w: "pea", p: "🫛" },
          { w: "pie", p: "🥧" }, { w: "po", say: "poe", p: "🍿" }, { w: "pop", p: "🍿" },
        ]),
        L("start", "Start of words", "pig, pizza", [
          { w: "pig", p: "🐷" }, { w: "pizza", p: "🍕" }, { w: "pear", p: "🍐" }, { w: "popcorn", p: "🍿" },
          { w: "panda", p: "🐼" }, { w: "pumpkin", p: "🎃" }, { w: "penguin", p: "🐧" }, { w: "pineapple", p: "🍍" },
          { w: "pen", p: "🖊️" }, { w: "puppy", p: "🐶" },
        ]),
        L("middle", "Middle of words", "apple, hippo", [
          { w: "apple", p: "🍎" }, { w: "hippo", p: "🦛" }, { w: "happy", p: "😀" }, { w: "teapot", p: "🫖" },
          { w: "cupcake", p: "🧁" }, { w: "lollipop", p: "🍭" }, { w: "sleepy", p: "😴" }, { w: "napkin", p: "🧻" },
        ]),
        L("end", "End of words", "cup, map", [
          { w: "cup", p: "☕" }, { w: "map", p: "🗺️" }, { w: "sheep", p: "🐑" }, { w: "soap", p: "🧼" },
          { w: "jeep", p: "🚙" }, { w: "ship", p: "🚢" }, { w: "rope", p: "🪢" }, { w: "grape", p: "🍇" },
        ]),
        L("sentences", "Silly sentences", "Pop the popcorn.", [
          { w: "Pop the popcorn.", p: "🍿" }, { w: "A pig in a cup.", p: "🐷☕" },
          { w: "Pizza for the puppy.", p: "🍕🐶" }, { w: "The penguin has a map.", p: "🐧🗺️" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    B: {
      label: "B", cue: "⚽", cueText: "Bouncy ball: b-b-b!",
      color: "#ffe0b3", dark: "#a35d00", highlight: /b/gi, on: false, level: "start", group: "early",
      tip: "Lips close, then pop open with the voice on: \"b-b-b\", like a bouncing ball. " +
        "If it comes out as \"p\", put his hand on his throat to feel the buzz.",
      coach: { pic: "⚽", how: "Lips together, then bounce!", hint: "Voice on, feel the buzz: b-b-b", model: "b-b-b", modelSay: "buh, buh, buh" },
      levels: [
        L("syllables", "Just the sound", "ba, bee, bye", [
          { w: "b-b-b", say: "buh, buh, buh", p: "⚽" }, { w: "ba", say: "bah", p: "⚽" }, { w: "bee", p: "🐝" },
          { w: "bo", say: "boe", p: "⚽" }, { w: "boo", p: "👻" }, { w: "bye", p: "👋" },
        ]),
        L("start", "Start of words", "ball, bear", [
          { w: "ball", p: "⚽" }, { w: "bee", p: "🐝" }, { w: "banana", p: "🍌" }, { w: "bear", p: "🐻" },
          { w: "bus", p: "🚌" }, { w: "boat", p: "⛵" }, { w: "bed", p: "🛏️" }, { w: "book", p: "📖" },
          { w: "bike", p: "🚲" }, { w: "bird", p: "🐦" },
        ]),
        L("middle", "Middle of words", "baby, robot", [
          { w: "baby", p: "👶" }, { w: "robot", p: "🤖" }, { w: "rabbit", p: "🐰" }, { w: "cowboy", p: "🤠" },
          { w: "zebra", p: "🦓" }, { w: "ribbon", p: "🎀" }, { w: "rainbow", p: "🌈" }, { w: "bubble", p: "🫧" },
        ]),
        L("end", "End of words", "crab, web", [
          { w: "crab", p: "🦀" }, { w: "web", p: "🕸️" }, { w: "tub", p: "🛁" }, { w: "cab", p: "🚕" },
          { w: "cube", p: "🧊" }, { w: "globe", p: "🌍" },
        ]),
        L("sentences", "Silly sentences", "A bear on a bike.", [
          { w: "A bear on a bike.", p: "🐻🚲" }, { w: "The baby has a ball.", p: "👶⚽" },
          { w: "Big bubbles in the tub.", p: "🫧🛁" }, { w: "A bee on a banana.", p: "🐝🍌" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    M: {
      label: "M", cue: "😋", cueText: "Yummy: mmm!",
      color: "#f9d0f0", dark: "#9b2f86", highlight: /m/gi, on: false, level: "start", group: "early",
      tip: "Lips close and hum: \"mmm\", like something yummy. He can feel the buzz on his lips. " +
        "It's easy to stretch, so start long: \"mmm-oon\" → \"moon\".",
      coach: { pic: "😋", how: "Close your lips and hum", hint: "Yummy: mmm", model: "mmm" },
      levels: [
        L("syllables", "Just the sound", "ma, me, moo", [
          { w: "mmm", p: "😋" }, { w: "ma", say: "mah", p: "😋" }, { w: "me", p: "🙋" },
          { w: "mo", say: "moe", p: "😋" }, { w: "moo", p: "🐮" }, { w: "my", p: "😋" },
        ]),
        L("start", "Start of words", "moon, mouse", [
          { w: "moon", p: "🌙" }, { w: "mouse", p: "🐭" }, { w: "monkey", p: "🐵" }, { w: "milk", p: "🥛" },
          { w: "map", p: "🗺️" }, { w: "mop", p: "🧹" }, { w: "mushroom", p: "🍄" }, { w: "magnet", p: "🧲" },
        ]),
        L("middle", "Middle of words", "hammer, lemon", [
          { w: "hammer", p: "🔨" }, { w: "lemon", p: "🍋" }, { w: "camel", p: "🐫" }, { w: "tomato", p: "🍅" },
          { w: "swimming", p: "🏊" }, { w: "umbrella", p: "☂️" }, { w: "mermaid", p: "🧜" }, { w: "family", p: "👪" },
        ]),
        L("end", "End of words", "drum, broom", [
          { w: "drum", p: "🥁" }, { w: "ham", p: "🍖" }, { w: "broom", p: "🧹" }, { w: "thumb", p: "👍" },
          { w: "worm", p: "🪱" }, { w: "ice cream", p: "🍦" }, { w: "home", p: "🏠" },
        ]),
        L("sentences", "Silly sentences", "More milk, please!", [
          { w: "The monkey has a lemon.", p: "🐵🍋" }, { w: "My mouse likes ice cream.", p: "🐭🍦" },
          { w: "A camel on the moon.", p: "🐫🌙" }, { w: "More milk, please!", p: "🥛" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    T: {
      label: "T", cue: "⏰", cueText: "Clock ticks: t-t-t!",
      color: "#d7e8ff", dark: "#2f5f9e", highlight: /t(?!h)/gi, on: false, level: "start", group: "early",
      tip: "The tongue tip taps the bumpy spot just behind the top teeth: \"t-t-t\", like a ticking clock. " +
        "It's a quiet sound with no voice. If it comes out as \"k\", show him the tongue tip going up in a mirror.",
      coach: { pic: "⏰", how: "Tongue taps behind your top teeth", hint: "Tick tock: t-t-t", model: "t-t-t", modelSay: "tuh, tuh, tuh" },
      levels: [
        L("syllables", "Just the sound", "ta, tea, toe", [
          { w: "t-t-t", say: "tuh, tuh, tuh", p: "⏰" }, { w: "ta", say: "tah", p: "⏰" }, { w: "tea", p: "🍵" },
          { w: "toe", p: "🦶" }, { w: "too", p: "⏰" }, { w: "tie", p: "👔" },
        ]),
        L("start", "Start of words", "tiger, tooth", [
          { w: "tiger", p: "🐯" }, { w: "tooth", p: "🦷" }, { w: "turtle", p: "🐢" }, { w: "tent", p: "⛺" },
          { w: "taxi", p: "🚕" }, { w: "tomato", p: "🍅" }, { w: "teapot", p: "🫖" }, { w: "two", p: "2️⃣" },
        ]),
        L("middle", "Middle of words", "kitten, water", [
          { w: "kitten", p: "🐱" }, { w: "butter", p: "🧈" }, { w: "water", p: "💧" }, { w: "guitar", p: "🎸" },
          { w: "potato", p: "🥔" }, { w: "button", p: "🔘" }, { w: "letter", p: "✉️" }, { w: "robot", p: "🤖" },
        ]),
        L("end", "End of words", "cat, hat", [
          { w: "cat", p: "🐱" }, { w: "hat", p: "🎩" }, { w: "boat", p: "⛵" }, { w: "kite", p: "🪁" },
          { w: "bat", p: "🦇" }, { w: "foot", p: "🦶" }, { w: "goat", p: "🐐" }, { w: "plate", p: "🍽️" },
        ]),
        L("sentences", "Silly sentences", "A tiger in a tent.", [
          { w: "A tiger in a tent.", p: "🐯⛺" }, { w: "The cat has a hat.", p: "🐱🎩" },
          { w: "Two turtles on a boat.", p: "🐢⛵" }, { w: "Tap the button.", p: "🔘" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    D: {
      label: "D", cue: "🥁", cueText: "Drum: d-d-d!",
      color: "#ecdcc4", dark: "#7a5530", highlight: /d/gi, on: false, level: "start", group: "early",
      tip: "Same spot as T, but with the voice on: \"d-d-d\", like a drum. " +
        "Put his hand on his throat to feel the buzz. If it comes out as \"g\", show the tongue tip going up.",
      coach: { pic: "🥁", how: "Tongue taps behind your top teeth", hint: "Voice on, like a drum: d-d-d", model: "d-d-d", modelSay: "duh, duh, duh" },
      levels: [
        L("syllables", "Just the sound", "da, dee, doe", [
          { w: "d-d-d", say: "duh, duh, duh", p: "🥁" }, { w: "da", say: "dah", p: "🥁" }, { w: "dee", p: "🥁" },
          { w: "doe", p: "🦌" }, { w: "do", say: "doo", p: "🥁" }, { w: "day", p: "☀️" },
        ]),
        L("start", "Start of words", "dog, duck", [
          { w: "dog", p: "🐶" }, { w: "duck", p: "🦆" }, { w: "dinosaur", p: "🦕" }, { w: "door", p: "🚪" },
          { w: "deer", p: "🦌" }, { w: "donut", p: "🍩" }, { w: "dolphin", p: "🐬" }, { w: "dice", p: "🎲" },
        ]),
        L("middle", "Middle of words", "ladder, spider", [
          { w: "ladder", p: "🪜" }, { w: "spider", p: "🕷️" }, { w: "panda", p: "🐼" }, { w: "radio", p: "📻" },
          { w: "pudding", p: "🍮" }, { w: "candle", p: "🕯️" }, { w: "medal", p: "🏅" },
        ]),
        L("end", "End of words", "bed, bird", [
          { w: "bed", p: "🛏️" }, { w: "bird", p: "🐦" }, { w: "red", p: "🔴" }, { w: "cloud", p: "☁️" },
          { w: "hand", p: "✋" }, { w: "road", p: "🛣️" }, { w: "bread", p: "🍞" }, { w: "seed", p: "🌱" },
        ]),
        L("sentences", "Silly sentences", "The dog has a donut.", [
          { w: "The dog has a donut.", p: "🐶🍩" }, { w: "A duck on the bed.", p: "🦆🛏️" },
          { w: "Dad plays the drum.", p: "🥁" }, { w: "A red door.", p: "🔴🚪" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    N: {
      label: "N", cue: "👃", cueText: "Nose hum: nnn!",
      color: "#e0e0ff", dark: "#4b4bab", highlight: /n(?!g)/gi, on: false, level: "start", group: "early",
      tip: "Tongue tip goes up behind the top teeth and he hums through his nose: \"nnn\". " +
        "Gently pinch his nose and the sound stops, so he can feel where it goes.",
      coach: { pic: "👃", how: "Tongue up, hum through your nose", hint: "Nose hum: nnn", model: "nnn" },
      levels: [
        L("syllables", "Just the sound", "na, knee, no", [
          { w: "nnn", p: "👃" }, { w: "na", say: "nah", p: "👃" }, { w: "knee", p: "🦵" },
          { w: "no", p: "🙅" }, { w: "new", p: "🆕" }, { w: "neigh", p: "🐴" },
        ]),
        L("start", "Start of words", "nose, nest", [
          { w: "nose", p: "👃" }, { w: "nest", p: "🪺" }, { w: "nut", p: "🥜" }, { w: "nine", p: "9️⃣" },
          { w: "net", p: "🥅" }, { w: "noodles", p: "🍜" }, { w: "necklace", p: "📿" },
        ]),
        L("middle", "Middle of words", "banana, bunny", [
          { w: "banana", p: "🍌" }, { w: "bunny", p: "🐰" }, { w: "honey", p: "🍯" }, { w: "money", p: "💰" },
          { w: "dinner", p: "🍽️" }, { w: "peanut", p: "🥜" }, { w: "window", p: "🪟" }, { w: "panda", p: "🐼" },
        ]),
        L("end", "End of words", "sun, moon", [
          { w: "sun", p: "☀️" }, { w: "moon", p: "🌙" }, { w: "pen", p: "🖊️" }, { w: "van", p: "🚐" },
          { w: "bone", p: "🦴" }, { w: "train", p: "🚆" }, { w: "rain", p: "🌧️" }, { w: "phone", p: "📱" },
        ]),
        L("sentences", "Silly sentences", "Nine nuts in a nest.", [
          { w: "Nine nuts in a nest.", p: "🥜🪺" }, { w: "The bunny has a bone.", p: "🐰🦴" },
          { w: "No noodles for me!", p: "🍜" }, { w: "The sun and the moon.", p: "☀️🌙" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    H: {
      label: "H", cue: "🌬️", cueText: "Huff and puff: h-h-h!",
      color: "#d9f3ec", dark: "#2b7a68", highlight: /\bh/gi, on: false, level: "start", group: "early",
      tip: "Just a breath out with the mouth open: \"h-h-h\", like huffing and puffing or fogging up a mirror. " +
        "Hold his hand in front of his mouth so he can feel the warm air. H only comes at the start of words.",
      coach: { pic: "🌬️", how: "Open mouth, puff out warm air", hint: "Huff and puff: h-h-h", model: "h-h-h", modelSay: "huh, huh, huh" },
      levels: [
        L("syllables", "Just the sound", "ha, he, hi", [
          { w: "h-h-h", say: "huh, huh, huh", p: "🌬️" }, { w: "ha", say: "hah", p: "😂" }, { w: "he", p: "🌬️" },
          { w: "hi", p: "👋" }, { w: "ho", say: "hoe", p: "🌬️" }, { w: "hoo", p: "🦉" },
        ]),
        L("start", "Start of words", "hat, horse", [
          { w: "hat", p: "🎩" }, { w: "horse", p: "🐴" }, { w: "house", p: "🏠" }, { w: "heart", p: "❤️" },
          { w: "hippo", p: "🦛" }, { w: "hand", p: "✋" }, { w: "hen", p: "🐔" }, { w: "hammer", p: "🔨" },
          { w: "honey", p: "🍯" }, { w: "helicopter", p: "🚁" },
        ]),
        L("sentences", "Silly sentences", "A hippo in a hat.", [
          { w: "A hippo in a hat.", p: "🦛🎩" }, { w: "Hello, happy hen!", p: "🐔" },
          { w: "Hold my hand.", p: "✋" }, { w: "A horse in a house.", p: "🐴🏠" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    W: {
      label: "W", cue: "👻", cueText: "Friendly ghost: wooo!",
      color: "#e6e6ee", dark: "#55565e", highlight: /w/gi, on: false, level: "start", group: "early",
      tip: "Lips make a small round circle, then open: \"wooo\", like a friendly ghost. " +
        "A mirror helps him see the round lips. W mostly comes at the start of words.",
      coach: { pic: "👻", how: "Lips round like an O", hint: "Friendly ghost: wooo", model: "wooo" },
      levels: [
        L("syllables", "Just the sound", "wa, wee, why", [
          { w: "wooo", p: "👻" }, { w: "wa", say: "wah", p: "👻" }, { w: "wee", p: "👻" },
          { w: "whoa", p: "😮" }, { w: "why", p: "🤷" }, { w: "way", p: "👉" },
        ]),
        L("start", "Start of words", "watch, worm", [
          { w: "watch", p: "⌚" }, { w: "water", p: "💧" }, { w: "web", p: "🕸️" }, { w: "worm", p: "🪱" },
          { w: "wolf", p: "🐺" }, { w: "whale", p: "🐳" }, { w: "window", p: "🪟" }, { w: "wand", p: "🪄" },
        ]),
        L("middle", "Middle of words", "kiwi, sandwich", [
          { w: "kiwi", p: "🥝" }, { w: "sandwich", p: "🥪" }, { w: "flower", p: "🌸" }, { w: "tower", p: "🗼" },
          { w: "highway", p: "🛣️" },
        ]),
        L("sentences", "Silly sentences", "A whale in the water.", [
          { w: "A whale in the water.", p: "🐳💧" }, { w: "The worm has a watch.", p: "🪱⌚" },
          { w: "Wave to the wolf!", p: "👋🐺" }, { w: "We want water.", p: "💧" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    Y: {
      label: "Y", cue: "🙌", cueText: "Cheer: yay, yay!",
      color: "#fff3a8", dark: "#8c7400", highlight: /\by/gi, on: false, level: "start", group: "early",
      tip: "The middle of the tongue pushes up, then slides into the vowel: \"yay!\". " +
        "Starting from a smiley \"ee\" helps: \"ee-ay\" → \"yay\".",
      coach: { pic: "🙌", how: "Start with a smile: ee", hint: "Then cheer: yay!", model: "yay" },
      levels: [
        L("syllables", "Just the sound", "yay, yo, you", [
          { w: "yay", p: "🙌" }, { w: "ya", say: "yah", p: "🙌" }, { w: "yes", p: "✅" },
          { w: "yo", say: "yoe", p: "🙌" }, { w: "you", p: "👉" },
        ]),
        L("start", "Start of words", "yo-yo, yellow", [
          { w: "yo-yo", p: "🪀" }, { w: "yellow", p: "💛" }, { w: "yarn", p: "🧶" }, { w: "yawn", p: "🥱" },
          { w: "yes", p: "✅" }, { w: "yummy", p: "😋" }, { w: "yolk", p: "🍳" },
        ]),
        L("sentences", "Silly sentences", "Yes, I like yellow!", [
          { w: "Yes, I like yellow!", p: "💛" }, { w: "A yo-yo and yarn.", p: "🪀🧶" },
          { w: "Yummy, yummy!", p: "😋" }, { w: "You can yawn.", p: "🥱" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    K: {
      label: "K", cue: "📷", cueText: "Camera: click, click!",
      color: "#c8f0ff", dark: "#1f6f8b", highlight: /ck|k|c(?![eihy])|q/gi, on: false, level: "start", group: "middle",
      tip: "The back of the tongue pushes up against the roof of the mouth, then lets go: \"k-k-k\", a quiet click like a camera. " +
        "Tipping his head back a little helps the tongue go back. If it comes out as \"t\", gently hold the tongue tip down " +
        "with a spoon or lollipop. K and G are made the same way; G just has the voice on.",
      coach: { pic: "📷", how: "Back of your tongue goes up", hint: "Quiet click: k-k-k", model: "k-k-k", modelSay: "kuh, kuh, kuh" },
      levels: [
        L("syllables", "Just the sound", "ka, key, coo", [
          { w: "k-k-k", say: "kuh, kuh, kuh", p: "📷" }, { w: "ka", say: "kah", p: "📷" }, { w: "key", p: "🔑" },
          { w: "co", say: "koe", p: "📷" }, { w: "coo", p: "🕊️" }, { w: "click", p: "📷" },
        ]),
        L("start", "Start of words", "cat, cow", [
          { w: "cat", p: "🐱" }, { w: "cow", p: "🐮" }, { w: "cake", p: "🎂" }, { w: "car", p: "🚗" },
          { w: "kite", p: "🪁" }, { w: "key", p: "🔑" }, { w: "cookie", p: "🍪" }, { w: "corn", p: "🌽" },
          { w: "king", p: "🤴" }, { w: "kangaroo", p: "🦘" },
        ]),
        L("middle", "Middle of words", "monkey, rocket", [
          { w: "monkey", p: "🐵" }, { w: "bucket", p: "🪣" }, { w: "chicken", p: "🐔" }, { w: "rocket", p: "🚀" },
          { w: "pancake", p: "🥞" }, { w: "turkey", p: "🦃" }, { w: "broccoli", p: "🥦" }, { w: "jacket", p: "🧥" },
        ]),
        L("end", "End of words", "book, duck", [
          { w: "book", p: "📖" }, { w: "duck", p: "🦆" }, { w: "sock", p: "🧦" }, { w: "rock", p: "🪨" },
          { w: "milk", p: "🥛" }, { w: "bike", p: "🚲" }, { w: "lock", p: "🔒" }, { w: "fork", p: "🍴" },
        ]),
        L("sentences", "Silly sentences", "The cat has a cake.", [
          { w: "The cat has a cake.", p: "🐱🎂" }, { w: "A duck in a car.", p: "🦆🚗" },
          { w: "Cookies for the king!", p: "🍪🤴" }, { w: "Kick the rock.", p: "🪨" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    F: {
      label: "F", cue: "🎈", cueText: "Balloon air: fff!",
      color: "#ffe4cc", dark: "#b05a10", highlight: /f|ph/gi, on: false, level: "start", group: "middle",
      tip: "Top teeth rest on the bottom lip and air blows out, with no voice: \"fff\", like air coming out of a balloon. " +
        "He should feel the air on his hand. If it comes out as \"p\", show him the teeth on the lip in a mirror.",
      coach: { pic: "🎈", how: "Top teeth on your bottom lip", hint: "Let the air out: fff", model: "fff" },
      levels: [
        L("syllables", "Just the sound", "fa, fee, foe", [
          { w: "fff", p: "🎈" }, { w: "fa", say: "fah", p: "🎈" }, { w: "fee", p: "🎈" },
          { w: "foe", p: "🎈" }, { w: "foo", p: "🎈" }, { w: "fun", p: "🥳" },
        ]),
        L("start", "Start of words", "fish, fox", [
          { w: "fish", p: "🐟" }, { w: "fox", p: "🦊" }, { w: "fire", p: "🔥" }, { w: "fork", p: "🍴" },
          { w: "feet", p: "🦶" }, { w: "five", p: "5️⃣" }, { w: "finger", p: "☝️" }, { w: "phone", p: "📱" },
          { w: "fairy", p: "🧚" }, { w: "fountain", p: "⛲" },
        ]),
        L("middle", "Middle of words", "coffee, waffle", [
          { w: "coffee", p: "☕" }, { w: "waffle", p: "🧇" }, { w: "elephant", p: "🐘" }, { w: "sofa", p: "🛋️" },
          { w: "dolphin", p: "🐬" }, { w: "muffin", p: "🧁" }, { w: "telephone", p: "☎️" },
        ]),
        L("end", "End of words", "leaf, giraffe", [
          { w: "leaf", p: "🍃" }, { w: "giraffe", p: "🦒" }, { w: "knife", p: "🔪" }, { w: "roof", p: "🏠" },
          { w: "wolf", p: "🐺" }, { w: "scarf", p: "🧣" }, { w: "chef", p: "🧑‍🍳" },
        ]),
        L("sentences", "Silly sentences", "Five fish for the fox.", [
          { w: "Five fish for the fox.", p: "🐟🦊" }, { w: "A giraffe on the sofa.", p: "🦒🛋️" },
          { w: "Feed the elephant.", p: "🐘" }, { w: "A fairy at the fountain.", p: "🧚⛲" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    NG: {
      label: "NG", cue: "🔔", cueText: "Bell: ding-dong!",
      color: "#efe0ff", dark: "#7340a8", highlight: /ng/gi, on: false, level: "end", group: "middle",
      tip: "The back of the tongue goes up (like K) and the sound hums through the nose: \"ng\", like a bell going ding-dong. " +
        "Don't add a \"g\" at the end: \"sing\", not \"sing-guh\". NG never comes at the start of a word.",
      coach: { pic: "🔔", how: "Back of your tongue up, hum in your nose", hint: "Like a bell: ding-dong", model: "ding-dong" },
      levels: [
        L("syllables", "Just the sound", "ding-dong, ring", [
          { w: "ding-dong", p: "🔔" }, { w: "ring", p: "💍" }, { w: "sing", p: "🎤" },
          { w: "bang", p: "💥" }, { w: "long", p: "📏" }, { w: "ping", p: "🔔" },
        ]),
        L("middle", "Middle of words", "finger, penguin", [
          { w: "finger", p: "☝️" }, { w: "singer", p: "🎤" }, { w: "kangaroo", p: "🦘" }, { w: "jungle", p: "🌴" },
          { w: "penguin", p: "🐧" }, { w: "ringing", p: "🔔" },
        ]),
        L("end", "End of words", "ring, king", [
          { w: "ring", p: "💍" }, { w: "king", p: "🤴" }, { w: "sing", p: "🎤" }, { w: "song", p: "🎵" },
          { w: "bang", p: "💥" }, { w: "ping-pong", p: "🏓" },
        ]),
        L("sentences", "Silly sentences", "The king can sing.", [
          { w: "The king can sing.", p: "🤴🎤" }, { w: "Ding-dong goes the bell.", p: "🔔" },
          { w: "A long song.", p: "🎵" }, { w: "Ring, ring, ring!", p: "🔔" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    J: {
      label: "J", cue: "🦘", cueText: "Jump, jump: j-j-j!",
      color: "#d6f5d6", dark: "#2f7a2f", highlight: /dge|j|g(?=[eiy])/gi, on: false, level: "start", group: "later",
      tip: "Like CH with the voice on: \"d\" sliding into a buzzy \"sh\": \"j-j-j\". " +
        "Lips push forward a little. Put his hand on his throat to feel the buzz. If it comes out as \"d\", " +
        "practise CH first, then turn the voice on.",
      coach: { pic: "🦘", how: "Lips push out, voice on", hint: "Jump, jump: j-j-j", model: "j-j-j", modelSay: "juh, juh, juh" },
      levels: [
        L("syllables", "Just the sound", "ja, joe, joy", [
          { w: "j-j-j", say: "juh, juh, juh", p: "🦘" }, { w: "ja", say: "jah", p: "🦘" }, { w: "gee", p: "🦘" },
          { w: "jo", say: "joe", p: "🦘" }, { w: "jay", p: "🦘" }, { w: "joy", p: "😊" },
        ]),
        L("start", "Start of words", "juice, jacket", [
          { w: "juice", p: "🧃" }, { w: "jacket", p: "🧥" }, { w: "jeep", p: "🚙" }, { w: "jet", p: "✈️" },
          { w: "jump", p: "🦘" }, { w: "giraffe", p: "🦒" }, { w: "gem", p: "💎" }, { w: "jack-o-lantern", p: "🎃" },
        ]),
        L("middle", "Middle of words", "magic, angel", [
          { w: "magic", p: "🪄" }, { w: "angel", p: "👼" }, { w: "engine", p: "🚂" }, { w: "danger", p: "⚠️" },
          { w: "pigeon", p: "🐦" }, { w: "banjo", p: "🪕" },
        ]),
        L("end", "End of words", "orange, bridge", [
          { w: "orange", p: "🍊" }, { w: "bridge", p: "🌉" }, { w: "badge", p: "📛" }, { w: "page", p: "📄" },
          { w: "sponge", p: "🧽" },
        ]),
        L("sentences", "Silly sentences", "Jump, jump, jump!", [
          { w: "Juice for the giraffe.", p: "🧃🦒" }, { w: "A jet and a jeep.", p: "✈️🚙" },
          { w: "Jump, jump, jump!", p: "🦘" }, { w: "An orange on a page.", p: "🍊📄" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    S: {
      label: "S", cue: "🐍", cueText: "Snake: sss!",
      color: "#ccf2e8", dark: "#1f7a62", highlight: /s(?!h)|c(?=[eiy])/gi, on: false, level: "start", group: "later",
      tip: "Teeth close together, tongue tip just behind them, smile and blow: a long snake \"sss\". " +
        "If the tongue pokes out between the teeth (it sounds like \"th\"), remind him to keep his teeth together. " +
        "A lisp is common until about age 7.",
      coach: { pic: "🐍", how: "Teeth together, smile and blow", hint: "Snake: sss", model: "sss", modelSay: "sssss" },
      levels: [
        L("syllables", "Just the sound", "sa, see, so", [
          { w: "sss", say: "sssss", p: "🐍" }, { w: "sa", say: "sah", p: "🐍" }, { w: "see", p: "👀" },
          { w: "so", say: "sew", p: "🐍" }, { w: "sue", p: "🐍" }, { w: "sigh", p: "😮‍💨" },
        ]),
        L("start", "Start of words", "sun, sock", [
          { w: "sun", p: "☀️" }, { w: "sock", p: "🧦" }, { w: "soap", p: "🧼" }, { w: "seal", p: "🦭" },
          { w: "sandwich", p: "🥪" }, { w: "seven", p: "7️⃣" }, { w: "six", p: "6️⃣" }, { w: "salad", p: "🥗" },
        ]),
        L("middle", "Middle of words", "pencil, castle", [
          { w: "pencil", p: "✏️" }, { w: "dinosaur", p: "🦕" }, { w: "bicycle", p: "🚲" }, { w: "glasses", p: "👓" },
          { w: "castle", p: "🏰" }, { w: "muscle", p: "💪" }, { w: "baseball", p: "⚾" },
        ]),
        L("end", "End of words", "bus, house", [
          { w: "bus", p: "🚌" }, { w: "house", p: "🏠" }, { w: "horse", p: "🐴" }, { w: "mouse", p: "🐭" },
          { w: "dress", p: "👗" }, { w: "juice", p: "🧃" }, { w: "ice", p: "🧊" }, { w: "kiss", p: "💋" },
        ]),
        L("sentences", "Silly sentences", "Six socks in the sun.", [
          { w: "Six socks in the sun.", p: "🧦☀️" }, { w: "A seal on a bus.", p: "🦭🚌" },
          { w: "The mouse has juice.", p: "🐭🧃" }, { w: "See the castle!", p: "🏰" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    Z: {
      label: "Z", cue: "🐝", cueText: "Bee buzz: zzz!",
      color: "#fff0b3", dark: "#8a6d00", highlight: /z/gi, on: false, level: "start", group: "later",
      tip: "Same as S, but with the voice on: \"zzz\", like a buzzing bee. " +
        "He can feel the buzz on his throat. Practise S first if Z comes out as \"d\".",
      coach: { pic: "🐝", how: "Teeth together, voice on", hint: "Bee buzz: zzz", model: "zzz" },
      levels: [
        L("syllables", "Just the sound", "za, zee, zoo", [
          { w: "zzz", p: "🐝" }, { w: "za", say: "zah", p: "🐝" }, { w: "zee", p: "🐝" },
          { w: "zo", say: "zoe", p: "🐝" }, { w: "zoo", p: "🦁" },
        ]),
        L("start", "Start of words", "zoo, zebra", [
          { w: "zoo", p: "🦁" }, { w: "zebra", p: "🦓" }, { w: "zero", p: "0️⃣" }, { w: "zip", p: "🤐" },
          { w: "zigzag", p: "⚡" }, { w: "zombie", p: "🧟" },
        ]),
        L("middle", "Middle of words", "lizard, puzzle", [
          { w: "lizard", p: "🦎" }, { w: "puzzle", p: "🧩" }, { w: "wizard", p: "🧙" }, { w: "dizzy", p: "😵" },
          { w: "buzzing", p: "🐝" }, { w: "frozen", p: "🥶" },
        ]),
        L("end", "End of words", "buzz, prize", [
          { w: "buzz", p: "🐝" }, { w: "fizz", p: "🥤" }, { w: "quiz", p: "❓" }, { w: "prize", p: "🏆" },
          { w: "breeze", p: "🍃" }, { w: "freeze", p: "🥶" }, { w: "sneeze", p: "🤧" },
        ]),
        L("sentences", "Silly sentences", "Zebras at the zoo.", [
          { w: "Zebras at the zoo.", p: "🦓🦁" }, { w: "The lizard has a puzzle.", p: "🦎🧩" },
          { w: "Buzz, buzz, says the bee.", p: "🐝" }, { w: "A prize for the wizard!", p: "🏆🧙" },
        ]),
      ],
    },

    // ------------------------------------------------------------------
    RB: {
      label: "R-blends", cue: "🥶", cueText: "So cold: brrr!",
      color: "#d4ecff", dark: "#245c99", highlight: /[bcdfgkpt]r/gi, on: false, level: "start", group: "pattern",
      tip: "Two sounds glued together: the first sound, then R. Say them slowly first, then faster: " +
        "\"buh-rrred\" → \"bread\". Only practise these once R on its own is getting easier.",
      coach: { pic: "🥶", how: "First sound, then growl the R", hint: "So cold: brrr!", model: "brrr" },
      levels: [
        L("syllables", "Just the sound", "brrr, tree, dry", [
          { w: "brrr", p: "🥶" }, { w: "gra", say: "grah", p: "🥶" }, { w: "tree", p: "🌳" },
          { w: "dry", p: "🥶" }, { w: "cry", p: "😢" }, { w: "fry", p: "🍳" },
        ]),
        L("start", "Start of words", "bread, crab, frog", [
          { w: "bread", p: "🍞" }, { w: "broccoli", p: "🥦" }, { w: "crab", p: "🦀" }, { w: "crayon", p: "🖍️" },
          { w: "crown", p: "👑" }, { w: "dragon", p: "🐉" }, { w: "drum", p: "🥁" }, { w: "frog", p: "🐸" },
          { w: "fries", p: "🍟" }, { w: "grapes", p: "🍇" }, { w: "tree", p: "🌳" }, { w: "train", p: "🚆" },
          { w: "truck", p: "🚚" }, { w: "present", p: "🎁" },
        ]),
        L("middle", "Middle of words", "zebra, umbrella", [
          { w: "zebra", p: "🦓" }, { w: "umbrella", p: "☂️" }, { w: "hundred", p: "💯" },
          { w: "astronaut", p: "🧑‍🚀" }, { w: "children", p: "🧒" },
        ]),
        L("sentences", "Silly sentences", "A green frog in a tree.", [
          { w: "A green frog in a tree.", p: "🐸🌳" }, { w: "The dragon has a drum.", p: "🐉🥁" },
          { w: "Brush the crab!", p: "🪥🦀" }, { w: "Grapes and bread on the train.", p: "🍇🍞" },
        ]),
      ],
    },
  });

  // Groups for the sounds that were already in words.js.
  const groups = { END: "pattern", L: "later", SH: "later", V: "middle", G: "middle", R: "later", CH: "later", TH: "later", SB: "pattern" };
  for (const [k, g] of Object.entries(groups)) if (window.SOUNDS[k] && !window.SOUNDS[k].group) window.SOUNDS[k].group = g;

  // S-blends used the snake too; now plain S has the snake, so S-blends gets the stop sign ("sss-top").
  if (window.SOUNDS.SB) window.SOUNDS.SB.cue = "🛑";

  window.SOUND_GROUPS = [
    { id: "early", name: "Early sounds", note: "Most children say these by about age 3–4." },
    { id: "middle", name: "Middle sounds", note: "Usually by about age 4–5." },
    { id: "later", name: "Later sounds", note: "Usually by about age 5–7, some up to 8." },
    { id: "pattern", name: "Word patterns", note: "Word endings and two sounds blended together." },
  ];
})();
