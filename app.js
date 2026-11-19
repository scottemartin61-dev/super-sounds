/* Super Sounds — game logic. Plain JavaScript, no build step. */
(() => {
  "use strict";

  const SOUNDS = window.SOUNDS;
  const THEMES = window.THEMES;
  // "My words" (added by a grown-up, kept on this iPad only) show up as an extra
  // level on any sound that has some.
  const MY_LEVEL = "my";
  const myItemsFor = (k) => data.myWords.filter((x) => x.sound === k);
  const levelsOf = (k) => {
    const mine = myItemsFor(k);
    return mine.length
      ? SOUNDS[k].levels.concat([{ id: MY_LEVEL, name: "⭐ My words", hint: "words from his own life", items: mine }])
      : SOUNDS[k].levels;
  };
  const findLevel = (k, id) => levelsOf(k).find((l) => l.id === id);
  const defaultLevel = (k) => (SOUNDS[k].levels.some((l) => l.id === SOUNDS[k].level) ? SOUNDS[k].level : SOUNDS[k].levels[0].id);
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");

  const MAX_TRIES = 3;          // after this many "Again" taps, move on gently
  const RECORD_SECONDS = 4;     // recording stops by itself after this
  const LISTEN_SECONDS = 6;     // hands-free: stop listening if he says nothing
  const QUIET_MS = 1000;        // hands-free: stop once he's been quiet this long
  const VOICE_START = 0.022;    // hands-free: how loud (RMS) counts as him starting to talk
  const HOLD_MS = 2000;         // hold time for the Grown-ups button

  // =================================================================
  //  Saved data (kept only on this device)
  // =================================================================
  const KEY = "superSounds.v1";
  const DEFAULT_SETTINGS = {
    name: "",
    theme: "animals",
    perRound: 5,
    rate: 0.75,
    autoSay: true,
    mic: true,
    sfx: true,
    voiceMeter: true,
    voiceLevel: "medium",
    useMyVoice: true,   // play a grown-up's recording instead of the iPad voice when there is one
    mixMine: true,      // mix "My words" into normal rounds
    handsFree: true,    // start listening by itself after the word is said (on by default)
    realSounds: true,   // recorded animal / vehicle / flush sounds
    sessionMins: 15,    // Practice time length (5 / 10 / 15)
    sessionBtn: true,   // show the Practice time button on the home screen
    sessionPicks: [],   // sounds picked last time for Practice time
    warnWords: 2,       // Practice time: words of warning before each change ("2 more, then 🎈"); 0 = off
    quiet: false,       // Quiet mode: no sound effects or animations, softer voice
    fxVol: 1,           // sound effects volume (0.35 / 0.65 / 1)
    greatFx: "every",   // sound on ⭐ Great: every / third / none
    kidStop: true,      // show his own ✋ Break and 👋 All done buttons
    autoHear: true,     // play his voice back by itself after each try
    triesGoal: 0,       // tries per Practice time to aim for (0 = no goal)
    buildBtn: true,     // show the 🔧 Build-it button on the home screen
    buildLevel: "want", // how he asks in Build-it: word / want / iwant / please
    buildModel: "first",// Build-it: say the phrase for him straight away ("first") or wait 5 seconds ("wait")
    saveTries: false,   // Voice report: keep his tries (anonymous) on this device until a grown-up exports them
  };
  // How loud (RMS) counts as a "big voice" for each meter setting.
  const VOICE_THRESHOLDS = { easy: 0.035, medium: 0.065, hard: 0.11 };

  function loadData() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    const s = d.settings || {};
    d.settings = Object.assign({}, DEFAULT_SETTINGS, s);
    d.myWords = (Array.isArray(d.myWords) ? d.myWords : [])
      .filter((x) => x && typeof x.w === "string" && x.w && SOUNDS[x.sound])
      .map((x) => Object.assign(x, { mine: true }));
    d.settings.sounds = {};
    for (const k of Object.keys(SOUNDS)) {
      const saved = (s.sounds || {})[k] || {};
      const okLevel = SOUNDS[k].levels.some((l) => l.id === saved.level) ||
        (saved.level === MY_LEVEL && d.myWords.some((x) => x.sound === k));
      const level = okLevel ? saved.level : defaultLevel(k);
      d.settings.sounds[k] = { on: typeof saved.on === "boolean" ? saved.on : !!SOUNDS[k].on, level };
    }
    if (!VOICE_THRESHOLDS[d.settings.voiceLevel]) d.settings.voiceLevel = "medium";
    if (!THEMES[d.settings.theme]) d.settings.theme = "animals";
    d.stickers = d.stickers || {};   // theme -> [collected stickers]
    d.stars = d.stars || 0;
    d.stats = d.stats || {};         // "R|start|rabbit" -> { t: tries, g: greats }
    d.days = d.days || {};           // "2026-11-17" -> rounds finished
    d.sessions = Array.isArray(d.sessions) ? d.sessions : [];   // finished Practice times
    if (!Array.isArray(d.settings.sessionPicks)) d.settings.sessionPicks = [];
    const oneOf = (k, list) => { if (!list.includes(d.settings[k])) d.settings[k] = DEFAULT_SETTINGS[k]; };
    oneOf("warnWords", [0, 1, 2, 3]);
    oneOf("fxVol", [0.35, 0.65, 1]);
    oneOf("greatFx", ["every", "third", "none"]);
    oneOf("triesGoal", [0, 50, 75, 100]);
    oneOf("buildLevel", ["word", "want", "iwant", "please"]);
    oneOf("buildModel", ["first", "wait"]);
    d.builds = Array.isArray(d.builds) ? d.builds : [];   // finished Build-it games
    d.tries = d.tries || {};         // "2026-11-17" -> tries (Great or Again taps) that day
    return d;
  }

  const data = loadData();
  const S = () => data.settings;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode etc. */ }
  }

  // ---------- Bigger things (grown-up recordings, photos) live in IndexedDB on this device ----------
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error("No storage")); return; }
        const req = indexedDB.open("superSounds", 2);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("audio")) d.createObjectStore("audio");
          if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos");
          if (!d.objectStoreNames.contains("tries")) d.createObjectStore("tries");   // Voice report clips
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      dbPromise.catch(() => { dbPromise = null; });
    }
    return dbPromise;
  }
  function idb(store, mode, fn) {
    return db().then((d) => new Promise((resolve, reject) => {
      const tx = d.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = tx.onabort = () => reject(tx.error);
    }));
  }
  const idbGet = (store, key) => idb(store, "readonly", (s) => s.get(key));
  const idbPut = (store, key, val) => idb(store, "readwrite", (s) => s.put(val, key));
  const idbDel = (store, key) => idb(store, "readwrite", (s) => s.delete(key));
  const idbKeys = (store) => idb(store, "readonly", (s) => s.getAllKeys());
  const idbClear = (store) => idb(store, "readwrite", (s) => s.clear());

  // Ask the browser not to clear our saved recordings and photos when space is low.
  function persistStorage() {
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {}
  }

  // =================================================================
  //  Small helpers
  // =================================================================
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function highlight(text, re) {
    const r = new RegExp(re.source, "gi");
    let out = "", last = 0, m;
    while ((m = r.exec(text))) {
      out += esc(text.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
      if (!m[0]) r.lastIndex++;
    }
    return out + esc(text.slice(last));
  }

  // Highlights the final consonant(s) — the word's "tail" — of chosen words.
  // words: list of words to mark (lower case), or null = mark the last word.
  function highlightEndings(text, words) {
    const tokens = text.match(/[A-Za-z']+|[^A-Za-z']+/g) || [];
    const wordIdx = tokens.map((t, i) => (/^[A-Za-z']+$/.test(t) ? i : -1)).filter((i) => i >= 0);
    const lastWord = wordIdx[wordIdx.length - 1];
    return tokens.map((t, i) => {
      const target = words ? words.includes(t.toLowerCase()) : i === lastWord;
      const m = target && t.match(/[bcdfghjklmnpqrstvxz]+e?$/i);
      if (!m) return esc(t);
      return esc(t.slice(0, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
    }).join("");
  }

  function highlightItem(soundKey, item) {
    const h = SOUNDS[soundKey].highlight;
    if (h === "ending") return highlightEndings(item.w, item.hl || null);
    return highlight(item.w, h);
  }

  function dayKey(date = new Date()) {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"),
      d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let toastTimer;
  function toast(msg, ms = 3200) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  const theme = () => THEMES[S().theme];
  const collected = () => (data.stickers[S().theme] = data.stickers[S().theme] || []);
  const soundVars = (k) => `--c:${SOUNDS[k].color};--d:${SOUNDS[k].dark}`;

  // =================================================================
  //  Voice (text-to-speech)
  // =================================================================
  const canSpeak = "speechSynthesis" in window;
  let voice = null;

  function pickVoice() {
    const vs = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
    voice =
      vs.find((v) => /samantha/i.test(v.name)) ||
      vs.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ||
      vs.find((v) => /en[-_]US/i.test(v.lang)) ||
      vs[0] || null;
  }
  if (canSpeak) {
    pickVoice();
    speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
  }

  function say(text, onEnd, rate) {
    if (!canSpeak) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-US";
    u.rate = rate || S().rate;
    u.pitch = 1.05;
    u.volume = S().quiet ? 0.6 : 1;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    voices.token++;
    if (voices.src) {
      try { voices.src.onended = null; voices.src.stop(); } catch (e) {}
      voices.src = null;
    }
    if (canSpeak) speechSynthesis.cancel();
  }

  // =================================================================
  //  Gentle sound effects (generated, no files)
  // =================================================================
  let actx = null;
  function audioCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  // All sound effects go through one volume control, and Quiet mode turns them off.
  const fxOn = () => S().sfx && !S().quiet;
  let fxNode = null;
  function fxOut(ctx) {
    if (!fxNode || fxNode.context !== ctx) { fxNode = ctx.createGain(); fxNode.connect(ctx.destination); }
    fxNode.gain.value = Number(S().fxVol) || 1;
    return fxNode;
  }

  function chime(kind = "small") {
    if (!fxOn()) return;
    const ctx = audioCtx();
    if (!ctx) return;
    const notes = kind === "big" ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 987.77];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const t = ctx.currentTime + i * 0.13;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.connect(g).connect(fxOut(ctx));
      o.start(t);
      o.stop(t + 0.75);
    });
  }

  // A short noise buffer, shared by the toilet-theme sounds.
  function noiseBuffer(ctx, seconds) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Toilet theme: a gentle cartoon flush (swirling water, then a few bubbles).
  function flush() {
    if (!fxOn()) return;
    const ctx = audioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 1.3);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(1400, t);
    bp.frequency.exponentialRampToValueAtTime(260, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.12);
    g.gain.setValueAtTime(0.22, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
    src.connect(bp).connect(g).connect(fxOut(ctx));
    src.start(t);
    src.stop(t + 1.3);
    // bubbles
    [0.95, 1.1, 1.22].forEach((dt, i) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      const s = t + dt;
      o.type = "sine";
      o.frequency.setValueAtTime(300 + i * 90, s);
      o.frequency.exponentialRampToValueAtTime(700 + i * 120, s + 0.08);
      og.gain.setValueAtTime(0, s);
      og.gain.linearRampToValueAtTime(0.12, s + 0.01);
      og.gain.exponentialRampToValueAtTime(0.001, s + 0.1);
      o.connect(og).connect(fxOut(ctx));
      o.start(s);
      o.stop(s + 0.12);
    });
  }

  // Toilet theme: a quick whoosh when the present opens.
  function whoosh() {
    if (!fxOn()) return;
    const ctx = audioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.6);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 2;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.connect(f).connect(g).connect(fxOut(ctx));
    src.start(t);
    src.stop(t + 0.6);
  }

  // ---------- Recorded sound effects (sounds/*.mp3) ----------
  const SFX = window.SFX || {};
  const STICKER_SFX = window.STICKER_SFX || {};
  const sfxBufs = new Map();    // name -> AudioBuffer (or a Promise while loading)
  const realOn = () => fxOn() && S().realSounds;
  const stickerSfx = (emoji) => STICKER_SFX[String(emoji).replace(/\uFE0F/g, "")] || null;

  function loadSfx(name) {
    if (!SFX[name]) return Promise.resolve(null);
    const have = sfxBufs.get(name);
    if (have) return Promise.resolve(have);
    const ctx = audioCtx();
    if (!ctx) return Promise.resolve(null);
    const p = fetch(`sounds/${name}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((ab) => decodeAudio(ctx, ab))
      .then((buf) => { sfxBufs.set(name, buf); return buf; })
      .catch(() => { sfxBufs.delete(name); return null; });
    sfxBufs.set(name, p);
    return p;
  }

  // Plays a recorded sound (quietly). Returns false if it can't, so callers can fall back.
  function playSfx(name, force = false) {
    if (!name || !SFX[name] || (!force && !realOn())) return false;
    const ctx = audioCtx();
    if (!ctx) return false;
    const go = (buf) => {
      if (!buf || !(buf instanceof AudioBuffer)) return;
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf;
      g.gain.value = 0.7;
      src.connect(g).connect(fxOut(ctx));
      src.start();
    };
    const have = sfxBufs.get(name);
    if (have instanceof AudioBuffer) go(have); else loadSfx(name).then(go);
    return true;
  }

  // Load them all in the background after the first tap (about 240 KB, and kept offline).
  function preloadSfx() { Object.keys(SFX).forEach((n) => loadSfx(n)); }

  // The "well done" sound for the current sticker theme: every Great, every 3rd, or none.
  // Returns true if it played.
  let greatN = 0;
  function greatSound() {
    greatN++;
    const g = S().greatFx;
    if (!fxOn() || g === "none" || (g === "third" && greatN % 3)) return false;
    if (theme().sfx === "flush") { if (!playSfx("flush")) flush(); }
    else chime("small");
    return true;
  }

  // Quiet mode also stops the bouncing and pulsing.
  function applyQuiet() { document.body.classList.toggle("quiet", !!S().quiet); }

  // iOS only allows sound after the first touch — unlock both on first tap.
  document.addEventListener("pointerdown", function unlock() {
    audioCtx();
    setTimeout(preloadSfx, 300);
    if (canSpeak) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
    }
    document.removeEventListener("pointerdown", unlock);
  });

  // =================================================================
  //  Grown-up voice: recordings of a familiar grown-up saying the words.
  //  Saved on this device only. Played instead of the iPad voice when there is one.
  // =================================================================
  const voices = { keys: new Set(), buffers: new Map(), src: null, token: 0 };
  // The same word shares one recording everywhere it appears ("toe" in two levels, etc).
  const voiceKey = (text) => String(text).toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim();
  const hasVoice = (text) => voices.keys.has(voiceKey(text));

  idbKeys("audio").then((keys) => {
    keys.forEach((k) => voices.keys.add(k));
    refreshVoiceBox();
  }).catch(() => {});

  function decodeAudio(ctx, arrayBuffer) {
    return new Promise((resolve, reject) => ctx.decodeAudioData(arrayBuffer, resolve, reject));
  }

  // Cut the silence before and after the word, and even out the loudness.
  // Keeps a generous tail so final sounds ("toaD") aren't clipped.
  function tidyClip(ctx, buf) {
    const ch = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; }
    if (peak < 0.002) return buf;
    const th = Math.max(0.008, peak * 0.05);
    let s = 0;
    while (s < ch.length && Math.abs(ch[s]) < th) s++;
    let e = ch.length - 1;
    while (e > s && Math.abs(ch[e]) < th) e--;
    s = Math.max(0, s - Math.floor(buf.sampleRate * 0.12));
    e = Math.min(ch.length, e + Math.floor(buf.sampleRate * 0.3));
    const len = Math.max(1, e - s);
    const gain = Math.min(6, 0.85 / peak);
    const out = ctx.createBuffer(1, len, buf.sampleRate);
    const o = out.getChannelData(0);
    for (let i = 0; i < len; i++) o[i] = ch[s + i] * gain;
    return out;
  }

  async function loadVoice(key) {
    if (voices.buffers.has(key)) return voices.buffers.get(key);
    const saved = await idbGet("audio", key);
    const ctx = audioCtx();
    if (!saved || !ctx) return null;
    const buf = tidyClip(ctx, await decodeAudio(ctx, saved.buf.slice(0)));
    voices.buffers.set(key, buf);
    return buf;
  }

  function playVoiceBuffer(buf, onEnd) {
    const ctx = audioCtx();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = S().quiet ? 0.6 : 1;
    src.connect(g).connect(ctx.destination);
    src.onended = () => { if (voices.src === src) voices.src = null; onEnd && onEnd(); };
    voices.src = src;
    src.start();
  }

  // Say a list of parts ([{text, say}]) one after another, using a grown-up
  // recording for any part that has one and the iPad voice for the rest.
  // rate (optional) slows the iPad voice down; grown-up recordings play as recorded.
  function speak(parts, onEnd, rate) {
    const useRec = S().useMyVoice && parts.some((p) => hasVoice(p.text));
    if (!useRec) {
      say(parts.map((p) => p.say || p.text).join(" ... "), onEnd, rate);
      return;
    }
    stopSpeaking();
    const token = voices.token;
    const next = (i) => {
      if (token !== voices.token) return;
      if (i >= parts.length) { onEnd && onEnd(); return; }
      const p = parts[i];
      const done = () => setTimeout(() => next(i + 1), i < parts.length - 1 ? 500 : 0);
      const tts = () => { if (token === voices.token) say(p.say || p.text, done, rate); };
      if (!hasVoice(p.text)) { tts(); return; }
      loadVoice(voiceKey(p.text))
        .then((buf) => { if (token !== voices.token) return; buf ? playVoiceBuffer(buf, done) : tts(); })
        .catch(tts);
    };
    next(0);
  }

  // ---------- Recording a grown-up (from the Grown-ups area) ----------
  const GROWN_RECORD_SECONDS = 8;
  const gRec = { key: null, mr: null, stream: null, chunks: [], timer: null };
  const pickAudioType = () => ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(
    (t) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));

  async function startGrownRecord(key) {
    if (!canRecord()) { toast("Recording isn't available on this device."); return; }
    stopSpeaking();
    gRec.key = key;
    refreshVoiceList();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      gRec.key = null;
      refreshVoiceList();
      toast("The microphone is blocked. Allow it in the iPad's Settings → Safari → Microphone.", 5000);
      return;
    }
    if (gRec.key !== key || screen !== "grown") { stream.getTracks().forEach((t) => t.stop()); return; }
    const type = pickAudioType();
    let mr;
    try { mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      gRec.key = null;
      refreshVoiceList();
      toast("Recording isn't available on this device.");
      return;
    }
    gRec.stream = stream;
    gRec.mr = mr;
    gRec.chunks = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) gRec.chunks.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(gRec.chunks, { type: mr.mimeType || type || "audio/mp4" });
      const k = gRec.key;
      gRec.mr = gRec.stream = gRec.key = null;
      refreshVoiceList();
      if (!k || !blob.size) return;
      try {
        await idbPut("audio", k, { type: blob.type, buf: await blob.arrayBuffer(), t: Date.now() });
        voices.keys.add(k);
        voices.buffers.delete(k);
        persistStorage();
        refreshVoiceBox();
        previewVoice(k);
      } catch (e) {
        toast("Couldn't save that recording.");
      }
    };
    mr.start();
    gRec.timer = setTimeout(stopGrownRecord, GROWN_RECORD_SECONDS * 1000);
    refreshVoiceList();
  }

  function stopGrownRecord() {
    clearTimeout(gRec.timer);
    if (gRec.mr && gRec.mr.state === "recording") gRec.mr.stop();
    else if (gRec.key && !gRec.mr) { gRec.key = null; refreshVoiceList(); }
  }

  function previewVoice(key) {
    stopSpeaking();
    loadVoice(key).then((buf) => buf && playVoiceBuffer(buf))
      .catch(() => toast("Couldn't play that recording."));
  }

  async function deleteVoice(key) {
    try { await idbDel("audio", key); } catch (e) {}
    voices.keys.delete(key);
    voices.buffers.delete(key);
    refreshVoiceBox();
  }

  // =================================================================
  //  Recording (kept in memory only, thrown away after each word)
  // =================================================================
  // state: idle | starting | listening (hands-free, waiting for him) | recording | done
  const rec = { mr: null, stream: null, chunks: [], url: null, clip: null, timer: null, state: "idle", token: 0,
    hands: false, heard: false, manual: false, vad: 0 };
  const handsFreeOn = () => S().mic && S().handsFree && canRecord();
  const player = new Audio();
  player.setAttribute("playsinline", "");

  const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  // hands = true: hands-free. Listen first, keep the word once he starts talking,
  // and stop by itself when he goes quiet.
  async function startRecording(hands = false) {
    if (!canRecord()) { toast("Recording isn't available on this device."); return; }
    if (!hands && round) round.sayTok++;   // a tap cancels any hands-free listen that's about to start
    stopSpeaking();
    player.pause();
    const token = ++rec.token;
    rec.hands = hands;
    rec.heard = !hands;
    rec.manual = !hands;
    rec.state = "starting";
    updateKidRow();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (e) {
      rec.state = rec.url ? "done" : "idle";
      updateKidRow();
      toast("The microphone is blocked. A grown-up can allow it in the iPad's Settings → Safari → Microphone.", 5000);
      return;
    }
    if (token !== rec.token) { stream.getTracks().forEach((t) => t.stop()); return; } // left the screen
    rec.stream = stream;
    const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(
      (t) => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    rec.chunks = [];
    try {
      rec.mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    } catch (e) {
      stopStream();
      rec.state = "idle";
      updateKidRow();
      toast("Recording isn't available on this device.");
      return;
    }
    rec.mr.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = () => {
      stopVad();
      const peak = stopMeter();
      stopStream();
      if (token !== rec.token) return;
      if (hands && !rec.heard) {
        // He didn't say anything: stop quietly, no "wrong" sound.
        rec.state = rec.url ? "done" : "idle";
        updateKidRow();
        const m = app.querySelector(".meter");
        if (m) m.classList.add("hidden");
        setMsg("Tap 🎤 when you're ready");
        return;
      }
      if (meterOn() && peak !== null) {
        setMsg(peak >= voiceThreshold() ? "Big voice! 📣" : "Try your BIG voice! 📣");
      }
      if (rec.url) URL.revokeObjectURL(rec.url);
      const blob = new Blob(rec.chunks, { type: (rec.mr && rec.mr.mimeType) || type || "audio/mp4" });
      rec.url = blob.size ? URL.createObjectURL(blob) : null;
      rec.blob = blob.size ? blob : null;
      rec.blobSaved = false;
      rec.clip = null;
      rec.state = rec.url ? "done" : "idle";
      updateKidRow();
      if (!rec.url) return;
      // Trim the silence before he spoke so "Hear me" starts right at his word.
      const ctx = audioCtx();
      if (!ctx || !blob.arrayBuffer) { if (S().autoHear) playBack(); return; }
      blob.arrayBuffer()
        .then((ab) => decodeAudio(ctx, ab))
        .then((b) => { if (token === rec.token) rec.clip = tidyClip(ctx, b); })
        .catch(() => {})
        .then(() => { if (token === rec.token && rec.url && S().autoHear) playBack(); });
    };
    rec.mr.start();
    rec.state = hands ? "listening" : "recording";
    updateKidRow();
    startMeter(stream);
    if (hands) {
      if (!watchVoice(stream, token)) { rec.heard = true; rec.manual = true; rec.state = "recording"; updateKidRow(); }
      rec.timer = setTimeout(stopRecording, (rec.manual ? RECORD_SECONDS : LISTEN_SECONDS + RECORD_SECONDS) * 1000);
    } else {
      rec.timer = setTimeout(stopRecording, RECORD_SECONDS * 1000);
    }
  }

  // Hands-free: tapping My turn while it's listening means "I'm talking now".
  function switchToManual() {
    rec.heard = true;
    rec.manual = true;
    rec.state = "recording";
    clearTimeout(rec.timer);
    rec.timer = setTimeout(stopRecording, RECORD_SECONDS * 1000);
    setMsg("");
    updateKidRow();
  }

  // Hands-free: notice when he starts talking and when he stops.
  // The first quarter-second sets the room's noise level so a noisy room doesn't trigger it.
  function watchVoice(stream, token) {
    const ctx = audioCtx();
    if (!ctx) return false;
    let src, an;
    try {
      src = ctx.createMediaStreamSource(stream);
      an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an);
    } catch (e) { return false; }
    const buf = new Float32Array(an.fftSize);
    const t0 = performance.now();
    let noise = 0, loud = 0, th = VOICE_START, quietSince = 0;
    stopVad();
    rec.vadSrc = src;
    rec.vad = setInterval(() => {
      if (token !== rec.token || !rec.mr || rec.mr.state !== "recording") { stopVad(); return; }
      an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      const now = performance.now();
      if (rec.manual) return;                       // grown-up/kid took over with a tap
      if (!rec.heard) {
        if (now - t0 < 250) { noise = Math.max(noise, rms); return; }
        th = Math.max(VOICE_START, Math.min(noise * 2.5, voiceThreshold()));
        loud = rms >= th ? loud + 1 : 0;
        if (loud >= 2) {
          rec.heard = true;
          rec.state = "recording";
          clearTimeout(rec.timer);
          rec.timer = setTimeout(stopRecording, RECORD_SECONDS * 1000);
          setMsg("");
          updateKidRow();
        } else if (now - t0 > LISTEN_SECONDS * 1000) {
          stopRecording();
        }
      } else if (rms >= th * 0.5) {
        quietSince = 0;
      } else if (!quietSince) {
        quietSince = now;
      } else if (now - quietSince > QUIET_MS) {
        stopRecording();
      }
    }, 40);
    return true;
  }

  function stopVad() {
    clearInterval(rec.vad);
    rec.vad = 0;
    try { if (rec.vadSrc) rec.vadSrc.disconnect(); } catch (e) {}
    rec.vadSrc = null;
  }

  // Hands-free: after the word has been said, start listening for him.
  function maybeListen() {
    if (!handsFreeOn() || screen !== "play" || !round || round.busy) return;
    const tok = round.sayTok;
    setTimeout(() => {   // short pause so the mic doesn't hear the iPad's own voice
      if (screen !== "play" || !round || round.busy || tok !== round.sayTok) return;
      if (rec.state !== "idle" && rec.state !== "done") return;
      startRecording(true);
    }, 300);
  }

  function stopRecording() {
    clearTimeout(rec.timer);
    if (rec.mr && rec.mr.state === "recording") rec.mr.stop();
  }

  function stopStream() {
    if (rec.stream) { rec.stream.getTracks().forEach((t) => t.stop()); rec.stream = null; }
  }

  // Throw away the recording (new word, or leaving the game).
  function resetRecording() {
    rec.token++;
    clearTimeout(rec.timer);
    stopVad();
    rec.clip = null;
    if (rec.mr && rec.mr.state === "recording") { try { rec.mr.stop(); } catch (e) {} }
    rec.mr = null;
    stopMeter();
    const m = app.querySelector(".meter");
    if (m) m.classList.add("hidden");
    stopStream();
    player.pause();
    player.removeAttribute("src");
    if (rec.url) URL.revokeObjectURL(rec.url);
    rec.url = null;
    rec.blob = null;
    rec.state = "idle";
  }

  // ---------- Big-voice meter (encourages talking out loud, not whispering) ----------
  const meter = { src: null, an: null, raf: 0, peak: 0 };
  const meterOn = () => S().mic && S().voiceMeter;
  const voiceThreshold = () => VOICE_THRESHOLDS[S().voiceLevel] || VOICE_THRESHOLDS.medium;

  function startMeter(stream) {
    if (!meterOn()) return;
    const ctx = audioCtx();
    if (!ctx) return;
    try {
      meter.src = ctx.createMediaStreamSource(stream);
      meter.an = ctx.createAnalyser();
      meter.an.fftSize = 1024;
      meter.src.connect(meter.an);
    } catch (e) { meter.src = meter.an = null; return; }
    const buf = new Float32Array(meter.an.fftSize);
    const el = app.querySelector(".meter");
    const fill = el && el.querySelector(".meter-fill");
    if (el) el.classList.remove("hidden", "full");
    meter.peak = 0;
    let shown = 0;
    const tick = () => {
      if (!meter.an) return;
      meter.an.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      meter.peak = Math.max(meter.peak, rms);
      shown = Math.max(rms, shown * 0.92);
      if (fill) fill.style.width = Math.min(100, (shown / voiceThreshold()) * 100) + "%";
      if (el) el.classList.toggle("full", meter.peak >= voiceThreshold());
      meter.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  // Stops the meter; returns the loudest level heard (or null if it wasn't running).
  function stopMeter() {
    cancelAnimationFrame(meter.raf);
    const ran = !!meter.an;
    try { if (meter.src) meter.src.disconnect(); } catch (e) {}
    meter.src = meter.an = null;
    const fill = app.querySelector(".meter-fill");
    if (fill && ran) fill.style.width = Math.min(100, (meter.peak / voiceThreshold()) * 100) + "%";
    return ran ? meter.peak : null;
  }

  function playBack() {
    if (!rec.url) return;
    stopSpeaking();
    player.pause();
    const hear = app.querySelector('[data-act="hear"]');
    const off = () => hear && hear.classList.remove("active");
    hear && hear.classList.add("active");
    if (rec.clip && audioCtx()) { playVoiceBuffer(rec.clip, off); return; }
    player.src = rec.url;
    player.onended = player.onpause = off;
    player.play().catch(off);
  }

  // =================================================================
  //  My words: words from his own life, with an emoji or a photo
  // =================================================================
  const photoURLs = new Map();   // word id -> object URL of its photo
  let pendingPhoto = null;       // photo picked in the add-word form, not saved yet
  let mwLastSound = null;        // keep the same sound picked when adding several words

  Promise.all(data.myWords.filter((x) => x.photo).map((x) =>
    idbGet("photos", x.id).then((r) => {
      if (r) photoURLs.set(x.id, URL.createObjectURL(new Blob([r.buf], { type: r.type })));
    }).catch(() => {})
  )).then(() => { if (screen === "play") render(); else if (screen === "grown") refreshMyList(); });

  function picHTML(item) {
    const url = item.photo && photoURLs.get(item.id);
    if (url) return `<img class="photo" src="${url}" alt="">`;
    return item.p || "⭐";
  }

  // Square-crop and shrink a photo so it stays small on the iPad.
  function shrinkPhoto(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h), size = Math.min(480, side);
        const c = document.createElement("canvas");
        c.width = c.height = size;
        c.getContext("2d").drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("photo"))), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("photo")); };
      img.src = url;
    });
  }

  async function onPhotoPicked(input) {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    try { pendingPhoto = await shrinkPhoto(file); } catch (e) { toast("Couldn't use that photo."); return; }
    const pv = document.getElementById("mw-preview");
    if (pv) {
      if (pv.dataset.url) URL.revokeObjectURL(pv.dataset.url);
      pv.dataset.url = URL.createObjectURL(pendingPhoto);
      pv.innerHTML = `<img src="${pv.dataset.url}" alt="Chosen photo">
        <button class="mini" data-act="mw-clear-photo" aria-label="Remove photo">✕</button>`;
    }
  }

  function clearPendingPhoto() {
    pendingPhoto = null;
    const pv = document.getElementById("mw-preview");
    if (pv) { if (pv.dataset.url) URL.revokeObjectURL(pv.dataset.url); pv.dataset.url = ""; pv.innerHTML = ""; }
  }

  async function addMyWord() {
    const wordEl = document.getElementById("mw-word");
    const w = wordEl.value.replace(/[|<>]/g, "").replace(/\s+/g, " ").trim();
    if (!w) { toast("Type a word first."); wordEl.focus(); return; }
    const sound = document.getElementById("mw-sound").value;
    const emoji = document.getElementById("mw-emoji").value.trim().slice(0, 12);
    if (data.myWords.some((x) => x.sound === sound && x.w.toLowerCase() === w.toLowerCase())) {
      toast(`"${w}" is already in My words for ${SOUNDS[sound].label}.`);
      return;
    }
    const id = "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const item = { id, w, sound, p: emoji, mine: true };
    if (pendingPhoto) {
      try {
        await idbPut("photos", id, { type: pendingPhoto.type, buf: await pendingPhoto.arrayBuffer() });
        item.photo = true;
        photoURLs.set(id, URL.createObjectURL(pendingPhoto));
        persistStorage();
      } catch (e) {
        toast("Couldn't save the photo, so the word was added without it.");
      }
    }
    data.myWords.push(item);
    mwLastSound = sound;
    save();
    const h = SOUNDS[sound].highlight;
    const hasSound = h === "ending" || new RegExp(h.source, "i").test(w);
    toast(hasSound ? `Added "${w}" to ${SOUNDS[sound].label}.`
      : `Added "${w}". Heads up: it doesn't seem to have the ${SOUNDS[sound].label} sound in it.`, hasSound ? 3000 : 6000);
    pendingPhoto = null;
    rerenderGrown();
  }

  function deleteMyWord(id) {
    const item = data.myWords.find((x) => x.id === id);
    if (!item || !confirm(`Remove "${item.w}" from My words?`)) return;
    data.myWords = data.myWords.filter((x) => x.id !== id);
    if (item.photo) {
      idbDel("photos", id).catch(() => {});
      if (photoURLs.has(id)) URL.revokeObjectURL(photoURLs.get(id));
      photoURLs.delete(id);
    }
    const k = item.sound;
    if (!myItemsFor(k).length) {
      if (S().sounds[k].level === MY_LEVEL) S().sounds[k].level = defaultLevel(k);
      if (voicePick && voicePick.sound === k && voicePick.level === MY_LEVEL) voicePick.level = S().sounds[k].level;
    }
    save();
    rerenderGrown();
  }

  // =================================================================
  //  Screens
  // =================================================================
  let screen = "home";
  let round = null;      // the current practice round
  let reward = null;     // the sticker just earned

  function show(name) {
    if (screen === "play" && name !== "play") { resetRecording(); stopSpeaking(); stopMirror(); }
    if (screen === "grown" && name !== "grown") { stopGrownRecord(); stopSpeaking(); clearPendingPhoto(); }
    if (name === "grown" && screen === "sounds") { screen = name; render(); scrollToId("sounds-panel"); return; }
    if ((screen === "warm" || screen === "brk") && name !== screen) { if (session) session.tok++; stopSpeaking(); }
    if (screen === "build" && name !== "build") {
      stopBuildRec(true);
      if (build) { clearTimeout(build.timer); build.tok++; }
      build = null;
      stopSpeaking();
    }
    screen = name;
    render();
    window.scrollTo(0, 0);
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 12);
  }

  function render() {
    if (screen === "grown") setTimeout(refreshTriesCount, 0);
    ({ home: renderHome, play: renderPlay, reward: renderReward, book: renderBook, grown: renderGrown, sounds: renderSounds,
      spick: renderSessionPick, warm: renderWarm, brk: renderBreak, bpick: renderBuildPick, build: renderBuild })[screen]();
  }

  // ---------- Home ----------
  function renderHome() {
    const th = theme();
    const name = S().name.trim();
    const on = Object.keys(SOUNDS).filter((k) => S().sounds[k].on);
    const tiles = on.map((k) => {
      const s = SOUNDS[k];
      return `<button class="tile" style="${soundVars(k)}" data-act="start" data-sound="${k}"
          aria-label="Practise the ${esc(s.label)} sound">
          <span class="tile-cue">${s.cue}</span>
          <span class="tile-letter ${s.label.length > 2 ? "long" : ""}">${esc(s.label)}</span>
          <span class="tile-text">${esc(s.cueText)}</span>
        </button>`;
    }).join("");

    app.innerHTML = `
      <div class="screen home ${on.length > 3 ? "many" : ""} ${on.length > 5 ? "lots" : ""}">
        <header class="home-top">
          <span class="counter" aria-label="${data.stars} stars">⭐ ${data.stars}</span>
          <span class="counter" aria-label="${collected().length} stickers">📖 ${collected().length}</span>
        </header>
        <div class="hello">
          <div class="mascot bob" aria-hidden="true">${th.mascot}</div>
          <h1>Hi${name ? ", " + esc(name) : " there"}!</h1>
          <p>Which sound today?</p>
        </div>
        ${on.length
          ? `<div class="tiles">${tiles}</div>`
          : `<p class="empty-note">A grown-up needs to turn on a sound in the Grown-ups area.</p>`}
        <footer class="home-bottom">
          <button class="pill" data-act="book">📖<span class="wide-only"> Sticker</span> book</button>
          ${S().buildBtn ? `<button class="pill" data-act="b-open" aria-label="Build-it game">🔧 Build</button>` : ""}
          ${S().sessionBtn && on.length ? `<button class="pill main session-btn" data-act="s-open"
            aria-label="Practice time, ${sessionMins()} minutes">⏱️ ${sessionMins()} min<span class="wide-only"> practice</span></button>` : ""}
          <button class="pill hold" data-hold="grown" aria-label="Grown-ups: press and hold for 2 seconds">
            <span>🔒 Grown-ups<small>press &amp; hold</small></span>
          </button>
        </footer>
      </div>`;
  }

  // ---------- Starting a round ----------
  // My words always count under the "My words" level, even when mixed into another level.
  function statKey(sound, level, item) { return `${sound}|${item.mine ? MY_LEVEL : level}|${item.w}`; }

  // Pick words for a round. Words he finds tricky come up a bit more often.
  function pickWords(sound, level, n) {
    const lv = findLevel(sound, level);
    const pool = lv ? lv.items : [];
    if (!pool.length) return [];
    const weighted = (list) => list.map((item) => {
      const st = data.stats[statKey(sound, level, item)];
      const tricky = st && st.t >= 2 && st.g / st.t < 0.5;
      return { item, w: Math.random() * (tricky ? 1.6 : 1) };
    }).sort((a, b) => b.w - a.w).map((x) => x.item);
    const out = [];
    while (out.length < n) out.push(...(out.length ? shuffle(pool) : weighted(pool)));
    out.length = n;
    // Mix in about a third of his own words (not into the just-the-sound level).
    const mine = myItemsFor(sound);
    if (S().mixMine && level !== MY_LEVEL && level !== "syllables" && mine.length) {
      const picks = weighted(mine).slice(0, Math.min(mine.length, Math.max(1, Math.round(n / 3))));
      shuffle([...Array(n).keys()]).slice(0, picks.length).forEach((pos, i) => { out[pos] = picks[i]; });
    }
    return out;
  }

  function startRound(sound) {
    newTrySession();
    const level = S().sounds[sound].level;
    const items = pickWords(sound, level, S().perRound);
    if (!items.length) { toast("No words for this level yet."); return; }
    round = { sound, level, items, paused: false, idx: 0, tries: 0, greats: 0, busy: false, sayTok: 0, coach: 0 };
    show("play");
    if (S().autoSay) sayCurrent(); // called inside the tap so iOS allows it
  }

  const currentItem = () => round.items[round.idx];

  // ---------- Coaching after a miss ----------
  // round.coach: 0 = normal, 1 = slower + "how to" card, 2 = the sound on its own, then the word.
  const coachOf = (k) => SOUNDS[k].coach || { pic: SOUNDS[k].cue, how: SOUNDS[k].cueText, hint: "" };
  const slowRate = () => Math.max(0.45, S().rate * 0.7);

  function coachHTML() {
    const c = coachOf(round.sound);
    return `<div class="coach-pic" aria-hidden="true">${c.pic}</div>
      <div class="coach-text"><b>${esc(c.how)}</b>${c.hint ? `<span>${esc(c.hint)}</span>` : ""}</div>
      <div class="coach-btns">
        <button class="pill" data-act="coach-say">🔊 ${c.model ? "Just the sound" : "Slowly"}</button>
        <button class="pill ${mirror.stream ? "on" : ""}" data-act="mirror">🪞 ${mirror.stream ? "Close mirror" : "Mirror"}</button>
      </div>`;
  }

  function showCoach() {
    const el = document.getElementById("coach");
    if (!el) return;
    el.innerHTML = coachHTML();
    el.hidden = false;
  }

  function sayModel() {
    const item = currentItem();
    const c = coachOf(round.sound);
    stopSpeaking();
    speak([c.model ? { text: c.model, say: c.modelSay } : { text: item.w, say: item.say }], null, slowRate());
  }

  // ---------- Mirror: the front camera, so he can watch his mouth. Nothing is recorded. ----------
  const mirror = { stream: null, token: 0 };

  async function toggleMirror() {
    if (mirror.stream) { stopMirror(); return; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { toast("There's no camera on this device."); return; }
    const tok = ++mirror.token;
    let s;
    try {
      s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (e) {
      toast("The camera is blocked. A grown-up can allow it in the iPad's Settings → Safari → Camera.", 5000);
      return;
    }
    if (tok !== mirror.token || screen !== "play") { s.getTracks().forEach((t) => t.stop()); return; }
    mirror.stream = s;
    updateMirror();
  }

  function stopMirror() {
    mirror.token++;
    if (mirror.stream) mirror.stream.getTracks().forEach((t) => t.stop());
    mirror.stream = null;
    updateMirror();
  }

  function updateMirror() {
    if (screen !== "play") return;
    const card = app.querySelector(".card");
    const v = document.getElementById("mirror-video");
    if (card) card.classList.toggle("mirroring", !!mirror.stream);
    if (v) {
      if (mirror.stream && v.srcObject !== mirror.stream) { v.srcObject = mirror.stream; v.play().catch(() => {}); }
      if (!mirror.stream) v.srcObject = null;
    }
    const b = app.querySelector('[data-act="mirror"]');
    if (b) { b.textContent = mirror.stream ? "🪞 Close mirror" : "🪞 Mirror"; b.classList.toggle("on", !!mirror.stream); }
  }

  function sayCurrent() {
    if (round.session && (!session || session.paused)) return;
    if (roundPaused()) return;
    const item = currentItem();
    const btn = app.querySelector('[data-act="listen"]');
    btn && btn.classList.add("active");
    const step = round.coach || 0;
    const c = coachOf(round.sound);
    const parts = [];
    if (step >= 2) parts.push(c.model ? { text: c.model, say: c.modelSay } : { text: item.w, say: item.say });
    else if (item.pair) parts.push({ text: item.pair });
    parts.push({ text: item.w, say: item.say });
    if (round.intro) { parts.unshift({ text: round.intro }); round.intro = null; }
    const tok = ++round.sayTok;
    speak(parts, () => {
      btn && btn.classList.remove("active");
      if (round && tok === round.sayTok) maybeListen();
    }, step >= 1 ? slowRate() : undefined);
  }

  // ---------- Play ----------
  function renderPlay() {
    const s = SOUNDS[round.sound];
    const item = currentItem();
    const lvl = findLevel(round.sound, round.level);
    const dots = round.items.map((_, i) =>
      `<span class="dot ${i < round.idx ? "done" : i === round.idx ? "now" : ""}"></span>`).join("");
    const long = item.w.length > 12;
    const mic = S().mic;

    app.innerHTML = `
      <div class="screen play" style="${soundVars(round.sound)}">
        ${round.session ? sessionTopHTML() : `<header class="topbar">
          <button class="icon-btn" data-act="home" aria-label="Stop and go home">🏠</button>
          <div class="dots" aria-label="Word ${round.idx + 1} of ${round.items.length}">${dots}</div>
          <div class="stars" aria-label="${data.stars} stars">⭐ ${data.stars}</div>
        </header>`}
        <div class="cue">${s.cue} ${esc(s.label)} · ${esc(s.cueText)}</div>
        <main class="card ${item.pair ? "has-pair" : ""} ${mic && S().voiceMeter ? "has-meter" : ""}" aria-label="${esc(lvl ? lvl.name : "")}">
          ${item.pair ? `<div class="pair"><span aria-hidden="true">${item.pp}</span> ${esc(item.pair)} <span class="arrow">➜</span></div>` : ""}
          <div class="pic" aria-hidden="true">${picHTML(item)}</div>
          <video class="mirror-video" id="mirror-video" playsinline muted autoplay aria-label="Mirror"></video>
          <div class="word ${long ? "long" : ""}">${highlightItem(round.sound, item)}</div>
          ${mic && S().voiceMeter ? `<div class="meter hidden" aria-hidden="true">
            <span>🔈</span><div class="meter-track"><div class="meter-fill"></div></div><span>📣</span></div>` : ""}
          <div class="msg" id="msg" aria-live="polite"></div>
          ${kidStopHTML()}
        </main>
        <section class="coach" id="coach" aria-label="How to make the sound" ${round.coach ? "" : "hidden"}>${round.coach ? coachHTML() : ""}</section>
        <section class="kid-row ${mic ? "" : "two"}">
          <button class="big-btn" data-act="listen"><span class="ico">🔊</span>Listen</button>
          ${mic ? `
          <button class="big-btn" data-act="record"><span class="ico">🎤</span><span class="lbl">My turn</span></button>
          <button class="big-btn" data-act="hear" disabled><span class="ico">👂</span>Hear me</button>` : ""}
        </section>
        <section class="grown-row" aria-label="Grown-up buttons">
          <span class="label">Grown-up${round.session ? ` · <span id="tries-n">${triesText()}</span>` : ""}:</span>
          <button class="judge great" data-act="great">⭐ Great!</button>
          <button class="judge again" data-act="again">🔁 Again</button>
          <button class="judge skip" data-act="skip">Skip ➜</button>
        </section>
        ${pauseHTML()}
      </div>`;
    updateKidRow();
    updateMirror();
  }

  function updateKidRow() {
    if (screen !== "play") return;
    const recBtn = app.querySelector('[data-act="record"]');
    const hear = app.querySelector('[data-act="hear"]');
    if (!recBtn) return;
    const lbl = recBtn.querySelector(".lbl");
    recBtn.classList.toggle("rec", rec.state === "recording");
    recBtn.classList.toggle("listening", rec.state === "listening");
    recBtn.disabled = rec.state === "starting";
    lbl.textContent = rec.state === "recording" ? "Stop" : rec.state === "listening" ? "Listening…" : "My turn";
    hear.disabled = !rec.url || rec.state === "recording" || rec.state === "listening";
  }

  function setMsg(text) {
    const m = document.getElementById("msg");
    if (m) m.textContent = text;
  }

  function setJudgeDisabled(on) {
    app.querySelectorAll(".judge").forEach((b) => (b.disabled = on));
  }

  function record(item, great) {
    const k = statKey(round.sound, round.level, item);
    const st = (data.stats[k] = data.stats[k] || { t: 0, g: 0 });
    st.t++;
    if (great) st.g++;
    if (round.session && session) {
      session.tries++;
      if (great) session.greats++;
      const n = document.getElementById("tries-n");
      if (n) n.textContent = triesText();
    }
    const dk = dayKey();
    data.tries[dk] = (data.tries[dk] || 0) + 1;
    save();
    if (S().saveTries && rec.blob && !rec.blobSaved && !item.mine) {
      rec.blobSaved = true;
      saveTry(rec.blob, { game: round.session ? "practice" : "round", sound: round.sound, level: round.level,
        soundName: SOUNDS[round.sound].label, levelName: (findLevel(round.sound, round.level) || {}).name || round.level,
        target: item.w, pair: item.pair || null, mark: great ? "great" : "again", help: round.coach || 0 });
    }
  }

  function onGreat() {
    if (round.busy) return;
    round.busy = true;
    setJudgeDisabled(true);
    if (rec.state === "listening") { resetRecording(); updateKidRow(); }
    record(currentItem(), true);
    round.greats++;
    data.stars++;
    save();
    const starsEl = app.querySelector(".stars");
    if (starsEl) starsEl.textContent = `⭐ ${data.stars}`;
    const card = app.querySelector(".card");
    const b = document.createElement("span");
    b.className = "burst";
    b.textContent = "⭐";
    card.appendChild(b);
    setMsg(["Great job!", "You did it!", "Super sound!", "Wow!", "Nice!"][Math.floor(Math.random() * 5)]);
    const played = greatSound();
    setTimeout(nextWord, played && theme().sfx === "flush" ? 1400 : 1100);   // let the flush finish first
  }

  function onAgain() {
    if (round.busy) return;
    record(currentItem(), false);
    round.tries++;
    resetRecording();
    updateKidRow();
    if (round.tries >= MAX_TRIES) {
      round.busy = true;
      setJudgeDisabled(true);
      setMsg("Good trying! Let's try a new one.");
      setTimeout(nextWord, 1500);
    } else {
      round.coach = round.tries;   // 1: slower + how-to card, 2: the sound on its own first
      showCoach();
      setMsg(round.coach === 1 ? "Good trying! Let's go slow 🐢" : "Sound first, then the word 👂");
      setTimeout(() => { if (screen === "play") sayCurrent(); }, 500);
    }
  }

  function onSkip() {
    if (round.busy) return;
    round.busy = true;
    if (rec.state === "listening") { resetRecording(); updateKidRow(); }
    nextWord();
  }

  function nextWord() {
    if (screen !== "play") return;
    if (round.session && session && session.paused) { session.resumeNext = true; return; }
    if (roundPaused()) { round.resumeNext = true; return; }
    resetRecording();
    round.idx++;
    round.tries = 0;
    round.coach = 0;
    stopMirror();
    round.busy = false;
    if (round.session) {
      if (!session) return;
      // When time's up he gets a warning first: "Two more, then break time!" (Grown-ups → Practice time).
      if (session.left != null) {
        session.left--;
        if (session.left <= 0) { nextBlock(); return; }
        if (session.left === 1) round.intro = `Last one, then ${nextName()}!`;
      } else if (blockDone()) {
        if (!warnN()) { nextBlock(); return; }
        session.left = warnN();
        round.intro = session.left === 1 ? `Last one, then ${nextName()}!` : `${NUM[session.left]} more, then ${nextName()}!`;
      }
      if (round.idx >= round.items.length) {
        const more = sessionItems(block().sounds, 10);
        round.meta.push(...more);
        round.items.push(...more.map((x) => x.item));
      }
      round.sound = round.meta[round.idx].k;
      round.level = round.meta[round.idx].lv;
    } else if (round.idx >= round.items.length) { finishRound(); return; }
    render();
    if (round.session && session && session.left != null)
      setMsg(`${session.left === 1 ? "Last one" : session.left + " more"}, then ${nextIcon()}`);
    if (S().autoSay) setTimeout(() => { if (screen === "play") sayCurrent(); }, 350);
  }

  // A new sticker for his book (or a repeat once he has them all).
  function giveSticker() {
    const th = theme();
    const have = collected();
    const left = th.stickers.filter((x) => !have.includes(x));
    if (left.length) {
      const sticker = left[Math.floor(Math.random() * left.length)];
      have.push(sticker);
      return { sticker, isNew: true, complete: left.length === 1 };
    }
    return { sticker: th.stickers[Math.floor(Math.random() * th.stickers.length)], isNew: false, complete: true };
  }

  function finishRound() {
    const dk = dayKey();
    data.days[dk] = (data.days[dk] || 0) + 1;
    reward = giveSticker();
    save();
    show("reward");
    chime("big");
  }

  // =================================================================
  //  Practice time: a timed session in short blocks, like a therapy session.
  //  Listen (warm-up) → your turn → wiggle break + sticker → your turn → present.
  // =================================================================
  const TIME_SCALE = Number(new URLSearchParams(location.search).get("speed")) || 1;   // for testing only
  const SESSION_PLANS = {
    5: [["warm", 1], ["practice", 4]],
    10: [["warm", 1.5], ["practice", 4], ["break", 1], ["practice", 3.5]],
    15: [["warm", 2], ["practice", 6], ["break", 1], ["practice", 6]],
  };
  const BLOCK_ICON = { warm: "👂", practice: "🗣️", break: "🎈" };
  const BLOCK_NAME = { warm: "Listen", practice: "Your turn", break: "Wiggle break" };
  const MOVES = [
    ["🐸", "Jump like a frog!"], ["🦒", "Stretch up tall like a giraffe!"], ["🦖", "Stomp like a dinosaur!"],
    ["🐦", "Flap your wings like a bird!"], ["🐕", "Shake like a wet doggy!"], ["🐢", "Walk slowly like a turtle."],
    ["🌬️", "Take a big breath in, then blow it out slowly."], ["🙌", "Reach up high, then touch your toes!"],
  ];
  const MOVE_MS = 15000;
  let session = null;
  let sessionPicks = [];

  const sessionMins = () => (SESSION_PLANS[S().sessionMins] ? S().sessionMins : 15);
  const block = () => session.blocks[session.bi];
  const blockMs = (b) => b.m * 60000;
  const blockElapsed = () => (session.acc + (session.runStart ? performance.now() - session.runStart : 0)) * TIME_SCALE;
  const blockDone = () => blockElapsed() >= blockMs(block());
  const inSession = () => !!session && (screen === "warm" || screen === "brk" || (screen === "play" && round && round.session));

  function planText(mins) {
    return SESSION_PLANS[mins].map(([t, m]) => `${BLOCK_ICON[t]} ${BLOCK_NAME[t]} ${m} min`).join(" → ") + " → 🎁 Present";
  }

  function minsLeft() {
    let ms = Math.max(0, blockMs(block()) - blockElapsed());
    for (let i = session.bi + 1; i < session.blocks.length; i++) ms += blockMs(session.blocks[i]);
    return Math.ceil(ms / 60000);
  }
  const NUM = { 2: "Two", 3: "Three" };
  const warnN = () => Number(S().warnWords) || 0;
  const nextBlockOf = () => session.blocks[session.bi + 1];
  const nextName = () => { const n = nextBlockOf(); return !n ? "your present" : n.t === "break" ? "break time" : "your turn"; };
  const nextIcon = () => { const n = nextBlockOf(); return n ? BLOCK_ICON[n.t] : "🎁"; };
  // Minutes left, or the words left once the warning has started (● ● → 🎈).
  const leftText = () => {
    if (session.left != null) return `<span class="wdots" aria-label="${session.left} more">${"●".repeat(session.left)}</span> ${nextIcon()}`;
    const m = minsLeft();
    return m <= 0 ? "Almost done" : `${m} min left`;
  };
  const triesText = () => `${session.tries}${S().triesGoal ? " of " + S().triesGoal : ""} tr${session.tries === 1 && !S().triesGoal ? "y" : "ies"}`;
  const blockPct = () => Math.min(100, (100 * blockElapsed()) / blockMs(block()));

  // Words for a block: n for each sound, taken in turn (A, B, A, B...).
  function sessionItems(keys, n) {
    const lists = keys.map((k) => {
      const lv = S().sounds[k].level;
      return pickWords(k, lv, n).map((item) => ({ item, k, lv }));
    });
    const out = [];
    for (let i = 0; i < n; i++) lists.forEach((l) => l[i] && out.push(l[i]));
    return out;
  }

  // ---------- Choosing the sounds ----------
  function openSessionPick() {
    const on = Object.keys(SOUNDS).filter((k) => S().sounds[k].on);
    sessionPicks = S().sessionPicks.filter((k) => on.includes(k)).slice(0, 2);
    if (!sessionPicks.length && on.length === 1) sessionPicks = [on[0]];
    show("spick");
  }

  function togglePick(k) {
    if (sessionPicks.includes(k)) sessionPicks = sessionPicks.filter((x) => x !== k);
    else { sessionPicks.push(k); if (sessionPicks.length > 2) sessionPicks.shift(); }
    S().sessionPicks = sessionPicks.slice();
    save();
    render();
    app.querySelector(".screen").style.animation = "none";   // no fade on each tap
  }

  function renderSessionPick() {
    const mins = sessionMins();
    const on = Object.keys(SOUNDS).filter((k) => S().sounds[k].on);
    const tiles = on.map((k) => {
      const s = SOUNDS[k], picked = sessionPicks.includes(k);
      return `<button class="tile ${picked ? "picked" : ""}" style="${soundVars(k)}" data-act="s-pick" data-sound="${k}"
          aria-pressed="${picked}" aria-label="${esc(s.label)} sound">
          ${picked ? `<span class="tick" aria-hidden="true">✓</span>` : ""}
          <span class="tile-cue">${s.cue}</span>
          <span class="tile-letter ${s.label.length > 2 ? "long" : ""}">${esc(s.label)}</span>
          <span class="tile-text">${esc(s.cueText)}</span>
        </button>`;
    }).join("");
    const plan = SESSION_PLANS[mins].map(([t, m]) =>
      `<span class="plan-step"><b>${BLOCK_ICON[t]}</b>${esc(BLOCK_NAME[t])}<small>${m} min</small></span>`).join("") +
      `<span class="plan-step"><b>🎁</b>Present</span>`;
    app.innerHTML = `
      <div class="screen spick">
        <header class="book-head">
          <button class="icon-btn" data-act="home" aria-label="Back">⬅️</button>
          <h1>⏱️ Practice time</h1>
        </header>
        <div class="plan" aria-label="The plan">${plan}</div>
        <p class="pick-note">Pick 1 or 2 sounds${sessionPicks.length === 2 && SESSION_PLANS[mins].filter(([t]) => t === "practice").length > 1
          ? `: ${esc(SOUNDS[sessionPicks[0]].label)} first, ${esc(SOUNDS[sessionPicks[1]].label)} after the break` : ""}</p>
        <div class="tiles">${tiles}</div>
        <footer class="spick-go">
          <button class="pill main" data-act="s-start" ${sessionPicks.length ? "" : "disabled"}>▶️ Start</button>
        </footer>
      </div>`;
  }

  // ---------- Running the session ----------
  function startSession() {
    newTrySession();
    const keys = sessionPicks.filter((k) => S().sounds[k] && S().sounds[k].on);
    if (!keys.length) return;
    const mins = sessionMins();
    const plan = SESSION_PLANS[mins];
    const twoTurns = plan.filter(([t]) => t === "practice").length > 1 && keys.length > 1;
    let pi = 0;
    const blocks = plan.map(([t, m]) => ({ t, m, sounds: t === "practice" && twoTurns ? [keys[pi++ % keys.length]] : keys.slice() }));
    if (session) clearInterval(session.timer);
    session = { mins, keys, blocks, bi: -1, acc: 0, runStart: 0, doneMs: 0, tries: 0, greats: 0,
      paused: false, resumeNext: false, early: false, tok: 0, left: null, timer: setInterval(tickSession, 500) };
    nextBlock();
  }

  function nextBlock() {
    // A break that runs on while nobody taps "Let's go" doesn't count as practice time.
    if (session.bi >= 0) session.doneMs += block().t === "break" ? Math.min(blockElapsed(), blockMs(block())) : blockElapsed();
    session.bi++;
    session.acc = 0;
    session.left = null;
    session.runStart = performance.now();
    if (session.bi >= session.blocks.length) { finishSession(); return; }
    const b = block();
    if (b.t === "warm") startWarm(b);
    else if (b.t === "practice") startPractice(b);
    else startBreak();
  }

  function tickSession() {
    if (!session || session.paused || !inSession()) return;
    const f = document.getElementById("s-fill");
    if (f) f.style.width = blockPct() + "%";
    const l = document.getElementById("s-left");
    if (l) l.innerHTML = leftText();
    if (screen === "brk") tickBreak();
  }

  function sessionTopHTML() {
    const steps = session.blocks.map((b, i) =>
      `<span class="sstep ${i < session.bi ? "done" : i === session.bi ? "now" : ""}" title="${BLOCK_NAME[b.t]}">${BLOCK_ICON[b.t]}</span>`).join("") +
      `<span class="sstep" title="Present">🎁</span>`;
    return `<header class="topbar s-top">
        <button class="icon-btn" data-act="s-pause" aria-label="Pause">⏸️</button>
        <div class="s-mid">
          <div class="s-strip" aria-label="Step ${session.bi + 1} of ${session.blocks.length}: ${BLOCK_NAME[block().t]}">${steps}</div>
          <div class="s-bar" aria-hidden="true"><div class="s-fill" id="s-fill" style="width:${blockPct()}%"></div></div>
        </div>
        <div class="s-side">
          <div class="stars" aria-label="${data.stars} stars">⭐ ${data.stars}</div>
          <small id="s-left">${leftText()}</small>
        </div>
      </header>`;
  }

  // His own ✋ Break and 👋 All done buttons, in the corner of the card.
  function kidStopHTML() {
    if (!S().kidStop) return "";
    return `<div class="kid-stop">
        <button class="kid-stop-btn" data-act="kid-break" aria-label="I need a break">✋<small>Break</small></button>
        <button class="kid-stop-btn" data-act="kid-done" aria-label="I'm all done">👋<small>All done</small></button>
      </div>`;
  }

  // The cover over the screen when it's paused. pauseKind: "pause" (grown-up ⏸️), "break" (his ✋) or "done" (his 👋).
  let pauseKind = "pause";
  const roundPaused = () => !!(round && !round.session && round.paused);
  const anyPaused = () => !!(session && session.paused) || roundPaused() || !!(screen === "build" && build && build.paused);

  function quietBtnHTML() {
    return `<button class="pill" data-act="quiet" aria-pressed="${!!S().quiet}">🤫 Quiet mode: ${S().quiet ? "on" : "off"}</button>`;
  }

  function pauseBoxHTML() {
    const timed = !!session;
    const go = (main) => `<button class="pill ${main ? "main" : ""}" data-act="s-resume">▶️ Keep going</button>`;
    const fin = (main) => `<button class="pill ${main ? "main" : ""}" data-act="s-finish">🏁 Finish now</button>`;
    const so = timed && session.tries ? ` ${session.tries} tr${session.tries === 1 ? "y" : "ies"} so far.` : "";
    if (pauseKind === "done") return `
          <div class="mascot" aria-hidden="true">👋</div>
          <h2>All done?</h2>
          <p class="note">He asked to stop. That's fine: finishing now still earns the present.${so}</p>
          ${fin(true)}${go(false)}${quietBtnHTML()}`;
    if (pauseKind === "break") return `
          <div class="mascot" aria-hidden="true">✋</div>
          <h2>Break time</h2>
          <p class="note">He asked for a break.${timed ? " The timer has stopped." : ""} Take as long as he needs.${so}</p>
          ${go(true)}${fin(false)}${quietBtnHTML()}`;
    return `
          <div class="mascot" aria-hidden="true">${theme().mascot}</div>
          <h2>Paused</h2>
          <p class="note">${timed ? "The timer has stopped. " : ""}Stopping early is always fine.${so}</p>
          ${go(true)}${fin(false)}${quietBtnHTML()}`;
  }

  function pauseHTML() {
    return `<div class="pause-cover ${anyPaused() ? "" : "hidden"}" id="pause-cover">
        <div class="pause-box">${pauseBoxHTML()}</div>
      </div>`;
  }

  function showPauseCover() {
    const c = document.getElementById("pause-cover");
    if (!c) return;
    c.querySelector(".pause-box").innerHTML = pauseBoxHTML();
    c.classList.remove("hidden");
  }

  function pauseAny(kind) {
    pauseKind = kind;
    if (inSession()) pauseSession();
    else if (screen === "play" && round && !round.session) {
      if (!round.paused) {
        round.paused = true;
        round.sayTok++;
        stopSpeaking();
        player.pause();
        resetRecording(); updateKidRow(); stopMirror();
      }
      showPauseCover();
    } else if (screen === "build" && build && !build.done) {
      build.paused = true;
      build.tok++;
      clearTimeout(build.timer);
      stopBuildRec(true);
      stopSpeaking();
      showPauseCover();
    } else return;
    // Let him know he was heard.
    if (kind === "break") say("Okay, break time.");
    else if (kind === "done") say("Okay! All done.");
  }

  function resumeAny() {
    if (session && session.paused) { resumeSession(); return; }
    if (screen === "build" && build && build.paused) {
      build.paused = false;
      stopSpeaking();
      const c = document.getElementById("pause-cover");
      if (c) c.classList.add("hidden");
      if (build.sel >= 0) modelPart();
      return;
    }
    if (!roundPaused()) return;
    round.paused = false;
    stopSpeaking();
    const c = document.getElementById("pause-cover");
    if (c) c.classList.add("hidden");
    if (round.resumeNext) { round.resumeNext = false; nextWord(); return; }
    if (!round.busy) sayCurrent();
  }

  function finishAny() {
    stopSpeaking();
    if (session) { finishSessionNow(); return; }
    if (build && screen === "build") { build.paused = false; finishBuild(); return; }
    if (round && screen === "play") { round.paused = false; finishRound(); }
  }

  function pauseSession() {
    if (!session || session.paused) return;
    session.acc += session.runStart ? performance.now() - session.runStart : 0;
    session.runStart = 0;
    session.paused = true;
    session.tok++;
    if (round) round.sayTok++;
    stopSpeaking();
    player.pause();
    if (screen === "play") { resetRecording(); updateKidRow(); stopMirror(); }
    showPauseCover();
  }

  function resumeSession() {
    if (!session || !session.paused) return;
    session.paused = false;
    session.runStart = performance.now();
    stopSpeaking();
    const c = document.getElementById("pause-cover");
    if (c) c.classList.add("hidden");
    if (session.resumeNext) { session.resumeNext = false; nextWord(); return; }
    if (screen === "warm") warmSay();
    else if (screen === "play" && !round.busy) sayCurrent();
  }

  function finishSession() {
    const s = session;
    clearInterval(s.timer);
    const log = { d: new Date().toISOString(), plan: s.mins, mins: Math.round(s.doneMs / 6000) / 10,
      tries: s.tries, greats: s.greats, sounds: s.keys, early: s.early };
    data.sessions = data.sessions.concat(log).slice(-60);
    const dk = dayKey();
    data.days[dk] = (data.days[dk] || 0) + 1;
    reward = Object.assign(giveSticker(), { session: log });
    session = null;
    save();
    show("reward");
    chime("big");
  }

  function finishSessionNow() {
    if (!session) return;
    if (!session.paused) session.acc += session.runStart ? performance.now() - session.runStart : 0;
    session.runStart = 0;
    session.paused = false;
    session.early = true;
    session.doneMs += session.acc * TIME_SCALE;
    session.acc = 0;
    finishSession();
  }

  // ---------- Warm-up: he just listens to lots of words with his sound ----------
  function startWarm(b) {
    session.warm = { list: sessionItems(b.sounds, 12), idx: 0 };
    show("warm");
    warmSay();
  }
  const warmNow = () => session.warm.list[session.warm.idx];

  function warmSay() {
    if (!session || session.paused || screen !== "warm") return;
    const tok = ++session.tok;
    const { item } = warmNow();
    const ok = () => session && tok === session.tok && screen === "warm" && !session.paused;
    const btn = app.querySelector('[data-act="warm-again"]');
    btn && btn.classList.add("active");
    const parts = [{ text: item.w, say: item.say }];
    if (session.warm.intro) { parts.unshift({ text: session.warm.intro }); session.warm.intro = null; }
    speak(parts, () => {
      btn && btn.classList.remove("active");
      if (ok()) setTimeout(() => { if (ok()) warmNext(); }, 1400);
    });
  }

  function warmNext() {
    if (!session || screen !== "warm") return;
    session.tok++;
    if (session.left != null || (blockDone() && !warnN())) { nextBlock(); return; }
    const w = session.warm;
    if (blockDone()) { session.left = 1; w.intro = `Last one, then ${nextName()}!`; }
    w.idx++;
    if (w.idx >= w.list.length) w.list.push(...sessionItems(block().sounds, 12));
    render();
    warmSay();
  }

  function renderWarm() {
    const { item, k } = warmNow();
    const s = SOUNDS[k];
    app.innerHTML = `
      <div class="screen play warm" style="${soundVars(k)}">
        ${sessionTopHTML()}
        <div class="cue">${s.cue} ${esc(s.label)} · 👂 Just listen!</div>
        <main class="card">
          ${item.pair ? `<div class="pair"><span aria-hidden="true">${item.pp}</span> ${esc(item.pair)} <span class="arrow">➜</span></div>` : ""}
          <div class="pic" aria-hidden="true">${picHTML(item)}</div>
          <div class="word ${item.w.length > 12 ? "long" : ""}">${highlightItem(k, item)}</div>
          <div class="msg">${session.left != null ? `Last one, then ${nextIcon()}` : `Listen for the ${esc(s.label)} sound 👂`}</div>
          ${kidStopHTML()}
        </main>
        <section class="kid-row two">
          <button class="big-btn" data-act="warm-again"><span class="ico">🔊</span>Again</button>
        </section>
        <section class="grown-row" aria-label="Grown-up buttons">
          <span class="label">Grown-up:</span>
          <button class="judge again" data-act="warm-next">Next word ➜</button>
          <button class="judge skip" data-act="block-skip">Skip listening ➜</button>
        </section>
        ${pauseHTML()}
      </div>`;
  }

  // ---------- Practice blocks: the normal game, but it keeps going until time's up ----------
  function startPractice(b) {
    const list = sessionItems(b.sounds, 10);
    if (!list.length) { nextBlock(); return; }
    round = { sound: list[0].k, level: list[0].lv, items: list.map((x) => x.item), meta: list, idx: 0, tries: 0,
      greats: 0, busy: false, sayTok: 0, coach: 0, session: true, intro: "Your turn!" };
    show("play");
    setMsg("Your turn! 🎤");
    if (S().autoSay) sayCurrent();
  }

  // ---------- Wiggle break: open a present, then move about ----------
  function startBreak() {
    session.brk = { opened: false, openedAt: 0, move: -1, moveAt: 0, ready: false, order: shuffle(MOVES.slice()) };
    reward = giveSticker();
    save();
    show("brk");
    say("Break time! Open your present.");
  }

  function moveHTML() {
    const k = session.brk;
    if (k.move < 0) return "";
    const [pic, text] = k.order[k.move % k.order.length];
    return `<span class="move-pic" aria-hidden="true">${pic}</span><b>${esc(text)}</b>`;
  }

  function renderBreak() {
    const k = session.brk;
    app.innerHTML = `
      <div class="screen reward brk">
        ${sessionTopHTML()}
        <h1>🎈 Wiggle break!</h1>
        <button class="gift ${k.opened ? "hidden" : ""}" data-act="brk-open" aria-label="Open your present">🎁<small>Tap to open!</small></button>
        <div class="new-sticker ${k.opened ? "" : "hidden"}" aria-hidden="true">${reward.sticker}</div>
        <div class="move ${k.move >= 0 ? "" : "hidden"}" id="move" aria-live="polite">${moveHTML()}</div>
        <button class="pill main go ${k.ready ? "" : "hidden"}" data-act="brk-go">▶️ Let's go!</button>
        <button class="judge skip ${k.ready ? "hidden" : ""}" data-act="brk-go">Grown-up: skip the break ➜</button>
        ${pauseHTML()}
      </div>`;
  }

  function openBreakGift() {
    const k = session.brk;
    if (k.opened) return;
    k.opened = true;
    k.openedAt = blockElapsed();
    app.querySelector(".gift").classList.add("hidden");
    app.querySelector(".new-sticker").classList.remove("hidden");
    giftSounds();
  }

  function tickBreak() {
    const k = session.brk;
    const t = blockElapsed();
    if (k.opened && !k.ready && ((k.move < 0 && t - k.openedAt > 2500) || (k.move >= 0 && t - k.moveAt >= MOVE_MS))) {
      k.move++;
      k.moveAt = t;
      const el = document.getElementById("move");
      if (el) { el.innerHTML = moveHTML(); el.classList.remove("hidden"); }
      say(k.order[k.move % k.order.length][1]);
    }
    // Ready once the time is up and he's had at least one move to do (the timer starts before he opens the present).
    if (!k.ready && t >= blockMs(block()) && k.move >= 0 && t - k.moveAt >= 10000) {
      k.ready = true;
      app.querySelector(".go").classList.remove("hidden");
      app.querySelector('.judge.skip[data-act="brk-go"]').classList.add("hidden");
      say("Ready? Let's go!");
    }
  }

  // =================================================================
  //  🔧 Build-it: a game for asking. He picks something to build, taps a part he wants,
  //  and gets it by asking for it. The grown-up taps ✅ when he asks at his level.
  // =================================================================
  const KITS = [
    { id: "robot", e: "🤖", name: "robot", c: "#d9e8ff", d: "#3a6fc4",
      parts: [["👀", "eyes", 1], ["🦾", "arm"], ["🦿", "leg"], ["🔋", "battery"], ["📡", "antenna"], ["⚙️", "gear"]] },
    { id: "rocket", e: "🚀", name: "rocket", c: "#ffdcd2", d: "#c4472a",
      parts: [["🔥", "fire"], ["🪟", "window"], ["⛽", "fuel"], ["🧑‍🚀", "astronaut"], ["⭐", "star"], ["🌙", "moon"]] },
    { id: "train", e: "🚂", name: "train", c: "#d8f0d8", d: "#2f8a3f",
      parts: [["🛞", "wheel"], ["🛤️", "track"], ["🚃", "carriage"], ["💨", "steam"], ["🔔", "bell"], ["🎫", "ticket"]] },
    { id: "firetruck", e: "🚒", name: "fire truck", c: "#ffd6d6", d: "#c62828",
      parts: [["🛞", "wheel"], ["🪜", "ladder"], ["🚨", "siren"], ["💧", "water"], ["🧑‍🚒", "firefighter"], ["🪖", "helmet"]] },
    { id: "bathroom", e: "🚽", name: "bathroom", c: "#d6f1f5", d: "#2a8a9a",
      parts: [["🧻", "paper"], ["🪠", "plunger"], ["🧼", "soap"], ["💧", "water"], ["🪥", "toothbrush"], ["🛁", "bath"]] },
    { id: "cake", e: "🎂", name: "cake", c: "#ffe0ef", d: "#c2427e",
      parts: [["🥚", "egg"], ["🥛", "milk"], ["🧈", "butter"], ["🍓", "strawberry"], ["🍫", "chocolate"], ["🕯️", "candle"]] },
  ];
  const BUILD_LEVELS = { word: "Word", want: "2 words", iwant: "Sentence", please: "Polite" };
  const BUILD_WAIT_MS = 5000;
  let build = null;

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function phraseFor(w, lv = S().buildLevel) {
    if (lv === "want") return `want ${w}`;
    if (lv === "iwant") return `I want the ${w}`;
    if (lv === "please") return `Can I have the ${w}, please?`;
    return w;
  }

  function openBuildPick() {
    show("bpick");
    say("What shall we build?");
  }

  function renderBuildPick() {
    const tiles = KITS.map((k) => `<button class="tile" style="--c:${k.c};--d:${k.d}" data-act="b-kit" data-kit="${k.id}"
        aria-label="Build the ${esc(k.name)}">
        <span class="tile-cue">${k.e}</span>
        <span class="tile-letter long">${esc(cap(k.name))}</span>
      </button>`).join("");
    app.innerHTML = `
      <div class="screen spick bpick">
        <header class="book-head">
          <button class="icon-btn" data-act="home" aria-label="Back">⬅️</button>
          <h1>🔧 What shall we build?</h1>
        </header>
        <div class="tiles">${tiles}</div>
      </div>`;
  }

  function startBuild(id) {
    const kit = KITS.find((k) => k.id === id);
    if (!kit) return;
    newTrySession();
    build = { kit, got: [], sel: -1, modelled: false, asks: 0, own: 0, level: S().buildLevel,
      paused: false, done: false, tok: 0, timer: 0, popped: -1 };
    show("build");
    buildSay([{ text: `Let's build the ${kit.name}! What do you want?` }]);
  }

  function buildSay(parts, onEnd) {
    if (!build || build.paused) return;
    const tok = ++build.tok;
    speak(parts, () => { if (build && tok === build.tok && onEnd) onEnd(); });
  }

  // He taps the part he wants. Then he asks for it, with the iPad's help straight away or after a 5-second wait.
  function pickPart(i) {
    if (!build || build.done || build.paused || build.got.includes(i)) return;
    clearTimeout(build.timer);
    build.sel = i;
    build.modelled = false;
    updateBuild();
    stopBuildRec(true);
    if (S().buildModel === "wait") {
      stopSpeaking();
      build.tok++;
      startBuildRec();
      build.timer = setTimeout(() => { if (build && build.sel === i && !build.paused) modelPart(); }, BUILD_WAIT_MS);
    } else modelPart();
  }

  // The iPad says the phrase for him to copy.
  function modelPart() {
    if (!build || build.sel < 0 || build.done) return;
    clearTimeout(build.timer);
    build.modelled = true;
    const ask = document.getElementById("build-ask");
    if (ask) ask.innerHTML = askHTML();
    stopBuildRec(true);   // don't record the iPad's own voice
    buildSay([{ text: phraseFor(build.kit.parts[build.sel][1]) }], () => startBuildRec());
  }

  // He asked: he gets the part, and hears it said back ("Here's the wheel!").
  function givePart() {
    if (!build || build.sel < 0 || build.done) return;
    clearTimeout(build.timer);
    const i = build.sel;
    const [, w, plural] = build.kit.parts[i];
    const meta = { game: "build", sound: null, level: build.level, levelName: BUILD_LEVELS[build.level], kit: build.kit.id,
      kitName: build.kit.name, part: w,
      target: phraseFor(w, build.level), mark: "given", help: build.modelled ? 1 : 0 };
    stopBuildRec(false, (blob) => { if (blob) saveTry(blob, meta); });
    build.got.push(i);
    build.asks++;
    if (!build.modelled) build.own++;
    build.sel = -1;
    build.popped = i;
    save();
    if (build.got.length === build.kit.parts.length) { completeBuild(); return; }
    updateBuild();
    chime("small");
    buildSay([{ text: `${plural ? "Here are" : "Here's"} the ${w}!` }]);
  }

  function completeBuild() {
    build.done = true;
    build.tok++;
    updateBuild();
    const fx = stickerSfx(build.kit.e);
    if (!(fx && playSfx(fx))) chime("big");
    const name = build.kit.name;
    setTimeout(() => buildSay([{ text: `You built the ${name}!` }]), 900);
  }

  function finishBuild() {
    if (!build) return;
    clearTimeout(build.timer);
    build.tok++;
    const b = build;
    const log = { d: new Date().toISOString(), kit: b.kit.id, level: b.level, asks: b.asks, own: b.own,
      parts: b.kit.parts.length, early: !b.done };
    data.builds = data.builds.concat(log).slice(-60);
    const dk = dayKey();
    data.days[dk] = (data.days[dk] || 0) + 1;
    reward = Object.assign(giveSticker(), { build: log });
    build = null;
    save();
    show("reward");
    chime("big");
  }

  function askHTML() {
    const k = build.kit;
    if (build.done) return `You built the ${esc(k.name)}! 🎉`;
    if (build.sel < 0) return `<span class="ask-hint">What do you want? 👇</span>`;
    const [e, w] = k.parts[build.sel];
    const waiting = S().buildModel === "wait" && !build.modelled;
    return `<span class="ask-e" aria-hidden="true">${e}</span>
      <span class="ask-phrase">${waiting ? "Ask for it! 🗣️" : `“${esc(phraseFor(w))}”`}</span>`;
  }

  function renderBuild() {
    const k = build.kit, n = k.parts.length, got = build.got.length, sel = build.sel >= 0;
    const parts = k.parts.map(([e, w], i) => {
      const has = build.got.includes(i);
      return `<button class="part ${has ? "got" : ""} ${build.sel === i ? "sel" : ""} ${build.popped === i ? "pop" : ""}"
          data-act="b-part" data-i="${i}" aria-label="${esc(w)}${has ? ", got it" : ""}">
          <span class="part-e" aria-hidden="true">${e}</span><span class="part-w">${esc(w)}</span>
        </button>`;
    }).join("");
    build.popped = -1;
    app.innerHTML = `
      <div class="screen build" style="--c:${k.c};--d:${k.d}">
        <header class="topbar">
          <button class="icon-btn" data-act="home" aria-label="Stop and go home">🏠</button>
          <h1 class="build-title">🔧 ${esc(cap(k.name))}</h1>
          <div class="stars" aria-label="${got} of ${n} parts">${got} / ${n}</div>
        </header>
        <main class="card build-card ${build.done ? "done" : ""}">
          <div class="build-obj" style="--p:${(got / n).toFixed(2)}" aria-hidden="true">${k.e}</div>
          <div class="build-ask" id="build-ask" aria-live="polite">${askHTML()}</div>
          ${build.done ? "" : kidStopHTML()}
        </main>
        ${build.done
          ? `<button class="gift build-gift" data-act="b-gift" aria-label="Open your present">🎁<small>Tap to open!</small></button>`
          : `<section class="parts" aria-label="Parts">${parts}</section>
        <section class="grown-row" aria-label="Grown-up buttons">
          <span class="label">Grown-up:</span>
          <button class="judge great" data-act="b-give" ${sel ? "" : "disabled"}>✅ He asked!</button>
          <button class="judge again" data-act="b-say" ${sel ? "" : "disabled"}>🔊 Say it for him</button>
        </section>`}
        ${pauseHTML()}
      </div>`;
  }

  function updateBuild() {
    if (screen !== "build") return;
    render();
    app.querySelector(".screen").style.animation = "none";   // no fade on each tap
  }

  // =================================================================
  //  🎙️ Voice report (optional, off by default).
  //  His judged tries are kept on this device with only: the word, sound, level, the grown-up's mark,
  //  the day and a random session number. No name, no device details, never My words.
  //  A grown-up exports them as one .zip for the report tool on their own computer.
  // =================================================================
  const MAX_SAVED_TRIES = 1500;
  let trySess = "", tryN = 0, savedFull = false;
  const randId = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join("");
  function newTrySession() { trySess = randId(6); tryN = 0; }

  // Mono 16 kHz WAV (what speech-to-text wants), with a little silence at each end and no hidden file details.
  function toWav16k(buf) {
    const src = buf.getChannelData(0), ratio = buf.sampleRate / 16000;
    const pad = 4800, n = Math.max(1, Math.floor(src.length / ratio)), total = n + pad * 2;
    const dv = new DataView(new ArrayBuffer(44 + total * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); dv.setUint32(4, 36 + total * 2, true); str(8, "WAVE"); str(12, "fmt ");
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    str(36, "data"); dv.setUint32(40, total * 2, true);
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * ratio), b = Math.min(src.length, Math.max(a + 1, Math.floor((i + 1) * ratio)));
      let s = 0;
      for (let j = a; j < b; j++) s += src[j];
      const v = Math.max(-1, Math.min(1, s / (b - a)));
      dv.setInt16(44 + (pad + i) * 2, v * 32767, true);
    }
    return dv.buffer;
  }

  async function saveTry(blob, meta) {
    if (!S().saveTries || savedFull) return;
    try {
      const ctx = audioCtx();
      if (!ctx) return;
      const keys = await idbKeys("tries");
      if (keys.length >= MAX_SAVED_TRIES) { savedFull = true; toast("Voice report is full. A grown-up can export and delete saved tries."); return; }
      const buf = tidyClip(ctx, await decodeAudio(ctx, await blob.arrayBuffer()));
      if (!trySess) newTrySession();
      const id = randId(10);
      const m = Object.assign({ id, s: trySess, n: ++tryN, day: dayKey() }, meta);
      await idbPut("tries", id, { meta: m, wav: toWav16k(buf) });
    } catch (e) { /* a try that can't be saved is simply skipped */ }
  }

  // Build-it has no "My turn" button, so with Voice report on it records quietly while he asks.
  const bRec = { mr: null, chunks: [], blob: null, timer: 0, tok: 0, onDone: null };
  async function startBuildRec() {
    if (!S().saveTries || !S().mic || !canRecord() || !build || build.paused || build.sel < 0) return;
    const tok = ++bRec.tok;
    bRec.blob = null;
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { return; }
    if (tok !== bRec.tok || !build || build.paused) { stream.getTracks().forEach((t) => t.stop()); return; }
    const type = pickAudioType();
    let mr;
    try { mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined); }
    catch (e) { stream.getTracks().forEach((t) => t.stop()); return; }
    bRec.mr = mr;
    bRec.chunks = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) bRec.chunks.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (tok !== bRec.tok) return;
      const b = new Blob(bRec.chunks, { type: mr.mimeType || type || "audio/mp4" });
      bRec.blob = b.size ? b : null;
      if (bRec.onDone) { const f = bRec.onDone; bRec.onDone = null; f(bRec.blob); }
    };
    mr.start();
    bRec.timer = setTimeout(() => { if (mr.state === "recording") mr.stop(); }, 10000);
  }
  // discard: throw the recording away. Otherwise onDone(blob) gets it once it has stopped.
  function stopBuildRec(discard, onDone) {
    clearTimeout(bRec.timer);
    const mr = bRec.mr;
    bRec.mr = null;
    if (discard) {
      bRec.tok++;
      bRec.blob = null;
      bRec.onDone = null;
      if (mr && mr.state === "recording") { try { mr.stop(); } catch (e) {} }
      return;
    }
    if (mr && mr.state === "recording") { bRec.onDone = onDone || null; try { mr.stop(); } catch (e) {} }
    else if (onDone) { const b = bRec.blob; bRec.blob = null; onDone(b); }
  }

  // ---------- Export: one .zip (manifest.json + clips/*.wav), no compression ----------
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function makeZip(files) {   // files: [{name, data: Uint8Array}]
    const parts = [], central = [];
    let offset = 0;
    const enc = new TextEncoder();
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);   // time 00:00, date 1980-01-01 (no real timestamps)
      h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + size;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/zip" });
  }

  async function savedTries() {
    const keys = await idbKeys("tries");
    const out = [];
    for (const k of keys) { const v = await idbGet("tries", k); if (v && v.meta && v.wav) out.push(v); }
    out.sort((a, b) => (a.meta.day + a.meta.s + String(a.meta.n).padStart(5, "0")).localeCompare(b.meta.day + b.meta.s + String(b.meta.n).padStart(5, "0")));
    return out;
  }

  async function buildTriesZip() {
    const list = await savedTries();
    if (!list.length) return null;
    const manifest = { app: "Super Sounds", format: 1, exported: dayKey(),
      note: "Anonymous practice tries. No names. 'target' is the word he was practising; 'mark' is the grown-up's judgement.",
      clips: list.map((x) => Object.assign({ file: `clips/${x.meta.id}.wav` }, x.meta)) };
    const files = [{ name: "manifest.json", data: new TextEncoder().encode(JSON.stringify(manifest, null, 1)) }]
      .concat(list.map((x) => ({ name: `clips/${x.meta.id}.wav`, data: new Uint8Array(x.wav) })));
    return { blob: makeZip(files), count: list.length };
  }

  async function exportTries() {
    let z;
    try { z = await buildTriesZip(); } catch (e) { toast("Couldn't read the saved tries."); return; }
    if (!z) { toast("No saved tries yet."); return; }
    const name = `super-sounds-tries-${dayKey()}.zip`;
    const file = new File([z.blob], name, { type: "application/zip" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Super Sounds tries" }); toast(`Exported ${z.count} tries.`); }
      catch (e) { if (e && e.name !== "AbortError") toast("Sharing didn't work. Try again."); }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    toast(`Exported ${z.count} tries.`);
  }

  async function refreshTriesCount() {
    const el = document.getElementById("tries-saved");
    if (!el) return;
    try {
      const list = await savedTries();
      const mb = list.reduce((a, x) => a + x.wav.byteLength, 0) / 1048576;
      el.innerHTML = `<b>${list.length}</b> tr${list.length === 1 ? "y" : "ies"} saved on this iPad (${mb.toFixed(1)} MB).`;
    } catch (e) { el.textContent = "Saved tries can't be read on this device."; }
  }

  if (new URLSearchParams(location.search).has("test")) window.__ssTest = { saveTry, buildTriesZip, newTrySession };   // for testing only

  // ---------- Reward ----------
  function renderReward() {
    const th = theme();
    const name = S().name.trim();
    const sess = reward.session;
    const bld = reward.build;
    const g = sess ? sess.greats : round ? round.greats : 0;
    app.innerHTML = `
      <div class="screen reward">
        <div class="mascot bob" aria-hidden="true">${th.mascot}</div>
        <h1>You did it${name ? ", " + esc(name) : ""}!</h1>
        ${sess ? `<p class="sub">You practised for ${sess.mins < 1 ? "a little while" : Math.round(sess.mins) + " minute" + (Math.round(sess.mins) === 1 ? "" : "s")}!</p>` : ""}
        <p class="sub">${bld ? (bld.asks ? `You asked for ${bld.asks} thing${bld.asks === 1 ? "" : "s"}!` : "Great building!")
          : sess && !sess.tries ? "Great listening!" : sess ? `${sess.tries} tr${sess.tries === 1 ? "y" : "ies"} · ⭐ ${g}` : g ? `You got ${"⭐".repeat(Math.min(g, 10))}` : "Great practising!"}</p>
        <button class="gift" data-act="open" aria-label="Open your present">🎁<small>Tap to open!</small></button>
        <div class="opened hidden">
          <div class="new-sticker" aria-hidden="true">${reward.sticker}</div>
          <p class="sub">${reward.isNew
            ? (reward.complete ? "You found ALL the stickers! 🎉" : "A new sticker for your book!")
            : "You have every sticker! Amazing!"}</p>
        </div>
        <div class="actions hidden">
          ${bld ? `<button class="pill main" data-act="b-open">🔧 Build again</button>`
            : sess ? "" : `<button class="pill main" data-act="again-round">🔁 Play again</button>`}
          <button class="pill" data-act="book">📖 Sticker book</button>
          <button class="pill" data-act="home">🏠 Home</button>
        </div>
      </div>`;
  }

  function openGift() {
    app.querySelector(".gift").classList.add("hidden");
    app.querySelector(".opened").classList.remove("hidden");
    app.querySelector(".actions").classList.remove("hidden");
    giftSounds();
  }

  function giftSounds() {
    if (theme().sfx === "flush") {
      if (!playSfx("whoosh")) whoosh();
      setTimeout(() => chime("big"), 350);
    } else chime("big");
    // The new sticker makes its own sound (moo, choo-choo, click...).
    const fx = reward && stickerSfx(reward.sticker);
    if (fx) setTimeout(() => playSfx(fx), 900);
  }

  // ---------- Sticker book ----------
  function renderBook() {
    const th = theme();
    const have = collected();
    const slots = th.stickers.map((x) => have.includes(x)
      ? (stickerSfx(x) && realOn()
        ? `<button class="slot sounds" data-act="sticker-sound" data-e="${x}" aria-label="Hear the ${x} sticker">${x}</button>`
        : `<div class="slot">${x}</div>`)
      : `<div class="slot empty" aria-label="Not found yet">?</div>`).join("");
    app.innerHTML = `
      <div class="screen book">
        <header class="book-head">
          <button class="icon-btn" data-act="home" aria-label="Home">🏠</button>
          <h1>${th.mascot} My sticker book</h1>
          <span class="book-count">${have.length} of ${th.stickers.length}</span>
        </header>
        <div class="book-grid">${slots}</div>
      </div>`;
  }

  // ---------- Grown-ups ----------
  function radioGroup(setting, options, current) {
    return `<div class="seg" role="radiogroup">${options.map(([val, label]) => `
      <label><input type="radio" name="${setting}" data-set="${setting}" value="${esc(val)}"
        ${String(val) === String(current) ? "checked" : ""}>${esc(label)}</label>`).join("")}</div>`;
  }

  function statsHTML() {
    const rows = [];
    for (const [k, snd] of Object.entries(SOUNDS)) {
      for (const lv of levelsOf(k)) {
        let t = 0, g = 0;
        const prefix = `${k}|${lv.id}|`;
        for (const [key, v] of Object.entries(data.stats)) {
          if (key.startsWith(prefix)) { t += v.t; g += v.g; }
        }
        if (t) rows.push(`<tr><td>${esc(snd.label)}</td><td>${esc(lv.name)}</td><td>${t}</td><td>${Math.round((100 * g) / t)}%</td></tr>`);
      }
    }
    const tricky = Object.entries(data.stats)
      .filter(([, v]) => v.t >= 3 && v.g / v.t < 0.5)
      .sort((a, b) => a[1].g / a[1].t - b[1].g / b[1].t)
      .slice(0, 10)
      .map(([key, v]) => {
        const [snd, , word] = key.split("|");
        return `<li><b>${esc(word)}</b> (${esc(snd)}) — ${v.g} great out of ${v.t} tries</li>`;
      });
    const sessions = data.sessions.slice(-10).reverse().map((x) => {
      const day = new Date(x.d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      const names = x.sounds.map((k) => (SOUNDS[k] ? SOUNDS[k].label : k)).join(", ");
      return `<tr><td>${esc(day)}</td><td>${esc(names)}</td><td>${x.mins} of ${x.plan} min${x.early ? " (stopped early)" : ""}</td>
        <td>${x.tries}${S().triesGoal && x.tries >= S().triesGoal ? " 🎯" : ""}</td><td>${x.tries ? Math.round((100 * x.greats) / x.tries) + "%" : "–"}</td></tr>`;
    });
    const builds = data.builds.slice(-10).reverse().map((x) => {
      const day = new Date(x.d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      const kit = KITS.find((k) => k.id === x.kit);
      return `<tr><td>${esc(day)}</td><td>${kit ? kit.e + " " + esc(kit.name) : esc(x.kit)}</td><td>${esc(BUILD_LEVELS[x.level] || x.level)}</td>
        <td>${x.asks} of ${x.parts}${x.early ? " (stopped early)" : ""}</td><td>${x.own}</td></tr>`;
    });
    let days = 0, rounds = 0, weekTries = 0;
    const perDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const n = data.days[dayKey(d)] || 0;
      const t = data.tries[dayKey(d)] || 0;
      if (n) { days++; rounds += n; }
      weekTries += t;
      perDay.push(`<span class="tday ${t ? "" : "none"}"><small>${esc(d.toLocaleDateString(undefined, { weekday: "short" }))}</small>${t || "–"}</span>`);
    }
    return `
      <p><b>This week:</b> practised on ${days} of the last 7 days (${rounds} round${rounds === 1 ? "" : "s"}),
         <b>${weekTries} tr${weekTries === 1 ? "y" : "ies"}</b>.
         <b>Stars:</b> ${data.stars}. <b>Stickers:</b> ${collected().length} of ${theme().stickers.length}.</p>
      <div class="field">Tries each day (last 7 days)<div class="tdays">${perDay.join("")}</div></div>
      ${rows.length ? `<table>
        <thead><tr><th>Sound</th><th>Level</th><th>Tries</th><th>Great</th></tr></thead>
        <tbody>${rows.join("")}</tbody></table>` : `<p class="note">No practice recorded yet.</p>`}
      ${tricky.length ? `<h3>Tricky words</h3><ul>${tricky.join("")}</ul>` : ""}
      ${sessions.length ? `<h3>Practice times</h3><table>
        <thead><tr><th>Day</th><th>Sounds</th><th>Time</th><th>Tries</th><th>Great</th></tr></thead>
        <tbody>${sessions.join("")}</tbody></table>` : ""}
      ${builds.length ? `<h3>🔧 Build-it</h3><table>
        <thead><tr><th>Day</th><th>Built</th><th>Level</th><th>Asks</th><th>On his own</th></tr></thead>
        <tbody>${builds.join("")}</tbody></table>
        <p class="note">"On his own" means he asked before the iPad said it for him. When that's most of his asks, try the next level.</p>` : ""}
      <p class="note">"Tries" counts every Great or Again tap. Skips aren't counted.${S().triesGoal ? ` 🎯 marks a Practice time that reached ${S().triesGoal} tries.` : ""}</p>`;
  }

  // ---------- Grown-ups: My words & grown-up voice sections ----------
  let voicePick = null;   // which sound/level the voice list shows

  function rerenderGrown() {
    if (screen !== "grown") return;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  const soundOptions = (selected) => Object.entries(SOUNDS).map(([k, s]) =>
    `<option value="${k}" ${k === selected ? "selected" : ""}>${s.cue} ${esc(s.label)}${S().sounds[k].on ? "" : " (hidden)"}</option>`).join("");

  function myListHTML() {
    if (!data.myWords.length) return `<p class="note">No words added yet.</p>`;
    const rows = Object.keys(SOUNDS).flatMap((k) => myItemsFor(k).map((it) => `
      <li class="wrow">
        <span class="thumb" aria-hidden="true">${picHTML(it)}</span>
        <span class="wtext">${highlightItem(k, it)}<small>${SOUNDS[k].cue} ${esc(SOUNDS[k].label)}${hasVoice(it.w) ? " · 🎙️ your voice" : ""}</small></span>
        <button class="mini" data-act="mw-del" data-id="${esc(it.id)}" aria-label="Remove ${esc(it.w)}">🗑</button>
      </li>`)).join("");
    return `<ul class="wlist">${rows}</ul>`;
  }

  function refreshMyList() {
    const el = document.getElementById("mw-list");
    if (el) el.innerHTML = myListHTML();
  }

  // Every word (and pair word) in one level, once each.
  function voiceTexts(sound, level) {
    const lv = findLevel(sound, level);
    if (!lv) return [];
    const seen = new Set(), out = [];
    const c = SOUNDS[sound].coach;
    if (c && c.model) {
      const key = voiceKey(c.model);
      seen.add(key);
      out.push({ text: c.model, key, pic: c.pic, note: "the sound on its own (used for coaching)" });
    }
    for (const it of lv.items) {
      for (const [text, pic] of [[it.pair, it.pp], [it.w, null]]) {
        if (!text) continue;
        const key = voiceKey(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ text, key, pic: pic || picHTML(it) });
      }
    }
    return out;
  }

  function ensureVoicePick() {
    if (!voicePick || !SOUNDS[voicePick.sound]) {
      const k = Object.keys(SOUNDS).find((x) => S().sounds[x].on) || Object.keys(SOUNDS)[0];
      voicePick = { sound: k, level: S().sounds[k].level };
    }
    if (!findLevel(voicePick.sound, voicePick.level)) voicePick.level = S().sounds[voicePick.sound].level;
    return voicePick;
  }

  function voiceListHTML() {
    const vp = ensureVoicePick();
    const texts = voiceTexts(vp.sound, vp.level);
    const done = texts.filter((t) => voices.keys.has(t.key)).length;
    const rows = texts.map((t) => {
      const has = voices.keys.has(t.key);
      const recording = gRec.key === t.key;
      return `<li class="wrow ${has ? "has" : ""}">
        <span class="thumb" aria-hidden="true">${t.pic}</span>
        <span class="wtext">${esc(t.text)}<small>${t.note ? esc(t.note) + " · " : ""}${has ? "✅ recorded" : "iPad voice"}</small></span>
        <button class="mini ${recording ? "recording" : ""}" data-act="vrec" data-key="${esc(t.key)}"
          ${gRec.key && !recording ? "disabled" : ""}>${recording ? "⏹ Stop" : has ? "🎙️ Redo" : "🎙️ Record"}</button>
        <button class="mini" data-act="vplay" data-key="${esc(t.key)}" ${has && !gRec.key ? "" : "disabled"} aria-label="Play your recording of ${esc(t.text)}">▶️</button>
        <button class="mini" data-act="vdel" data-key="${esc(t.key)}" ${has && !gRec.key ? "" : "disabled"} aria-label="Delete your recording of ${esc(t.text)}">🗑</button>
      </li>`;
    }).join("");
    return `<p class="note"><b>${done} of ${texts.length}</b> recorded at this level. ${voices.keys.size} recordings in total.</p>
      <ul class="wlist">${rows}</ul>`;
  }

  function voiceBoxHTML() {
    const vp = ensureVoicePick();
    return `<div class="voice-pick">
        <label class="field">Sound <select data-vp="sound">${soundOptions(vp.sound)}</select></label>
        <label class="field">Level <select data-vp="level">
          ${levelsOf(vp.sound).map((l) => `<option value="${l.id}" ${l.id === vp.level ? "selected" : ""}>${esc(l.name)}</option>`).join("")}
        </select></label>
      </div>
      <div id="voice-list">${voiceListHTML()}</div>`;
  }

  function refreshVoiceList() {
    const el = document.getElementById("voice-list");
    if (el) el.innerHTML = voiceListHTML();
  }
  function refreshVoiceBox() {
    const el = document.getElementById("voice-box");
    if (el) el.innerHTML = voiceBoxHTML();
    refreshMyList();
  }

  // ---------- Grown-ups → Sounds & levels (its own screen, so Grown-ups stays short) ----------
  const GROUPS = window.SOUND_GROUPS || [{ id: "all", name: "Sounds", note: "" }];

  function soundCardHTML(k) {
    const s = SOUNDS[k], st = S();
    const on = st.sounds[k].on;
    return `
      <div class="sound-card ${on ? "on" : "off"}" style="${soundVars(k)}">
        <label class="toggle sound-toggle"><input type="checkbox" data-set="sound-on" data-sound="${k}" ${on ? "checked" : ""}>
          <span class="sc-cue" aria-hidden="true">${s.cue}</span>
          <span class="sc-name">${esc(s.label)}${s.label.length > 2 ? "" : " sound"}<small>${esc(s.cueText)}</small></span>
        </label>
        ${on ? `<label class="field">Level
          <select data-set="sound-level" data-sound="${k}">
            ${levelsOf(k).map((l) => `<option value="${l.id}" ${l.id === st.sounds[k].level ? "selected" : ""}>
              ${esc(l.name)} (${l.items.length})</option>`).join("")}
          </select>
          <span class="note level-hint" id="hint-${k}">e.g. ${esc((findLevel(k, st.sounds[k].level) || {}).hint || "")}</span>
        </label>
        <details><summary>How to coach the ${esc(s.label)} sound</summary><p>${esc(s.tip)}</p></details>` : ""}
      </div>`;
  }

  function renderSounds() {
    const st = S();
    const onCount = Object.keys(SOUNDS).filter((k) => st.sounds[k].on).length;
    const groups = GROUPS.map((g) => {
      const keys = Object.keys(SOUNDS).filter((k) => g.id === "all" || (SOUNDS[k].group || "later") === g.id);
      if (!keys.length) return "";
      return `<section class="panel">
          <h2>${esc(g.name)}</h2>
          ${g.note ? `<p class="note">${esc(g.note)}</p>` : ""}
          <div class="sound-list">${keys.map(soundCardHTML).join("")}</div>
        </section>`;
    }).join("");
    app.innerHTML = `
      <div class="screen grown sounds-screen">
        <header class="book-head">
          <button class="icon-btn" data-act="grown-back" aria-label="Back to Grown-ups">⬅️</button>
          <h1>Sounds &amp; levels</h1>
        </header>
        <section class="panel">
          <p>Tick a sound to put it on his home screen. Only ticked sounds show up for him.
            <b>${onCount}</b> on right now.</p>
          <p class="note">Ask his speech therapist which sounds and levels to work on. The ages below are rough guides only.</p>
        </section>
        ${groups}
      </div>`;
  }

  function renderGrown() {
    const st = S();
    const onKeys = Object.keys(SOUNDS).filter((k) => st.sounds[k].on);
    const soundsSummary = onKeys.length
      ? onKeys.map((k) => `<span class="chip" style="${soundVars(k)}">${SOUNDS[k].cue} ${esc(SOUNDS[k].label)}</span>`).join("")
      : `<span class="note">None yet: he'll see an empty home screen.</span>`;

    app.innerHTML = `
      <div class="screen grown">
        <header class="book-head">
          <button class="icon-btn" data-act="home" aria-label="Done">✅</button>
          <h1>Grown-ups</h1>
        </header>

        <section class="panel">
          <h2>How to play together</h2>
          <ol>
            <li>He taps a sound. The iPad says each word slowly (🔊 replays it).</li>
            <li>He taps 🎤 <b>My turn</b> and says the word, then 👂 <b>Hear me</b> plays his voice back.</li>
            <li>You tap ⭐ <b>Great!</b> when the target sound was right, or 🔁 <b>Again</b> to have another go.
                After ${MAX_TRIES} tries it moves on by itself, so he never gets stuck.</li>
            <li>Every finished round earns a sticker, no matter how it went.</li>
            <li>For a longer session, tap ⏱️ <b>Practice time</b> on the home screen (see below).</li>
            <li>🔧 <b>Build</b> is a game for asking for things (see below).</li>
          </ol>
          <p class="note">Stop while it's still fun. Judge only the target sound,
            not the rest of the word. If he sees a speech therapist, ask which level each sound should be on.</p>
        </section>

        <section class="panel">
          <h2>Him</h2>
          <label class="field">His name (shown on screen)
            <input type="text" data-set="name" value="${esc(st.name)}" maxlength="24" autocomplete="off" placeholder="e.g. Sam">
          </label>
          <div class="field">Sticker collection
            ${radioGroup("theme", Object.entries(THEMES).map(([id, t]) => [id, `${t.mascot} ${t.name}`]), st.theme)}
          </div>
        </section>

        <section class="panel" id="my-words">
          <h2>⭐ My words</h2>
          <p class="note">Add words from his own life: family names, pets, toys, foods, places. They're saved on
            this iPad only, never online. Add them in the Home Screen app, not in Safari (they keep separate lists).</p>
          <div class="add-word">
            <label class="field">Word or short phrase
              <input type="text" id="mw-word" maxlength="40" autocomplete="off" placeholder="e.g. Grandma">
            </label>
            <label class="field">Sound it practises
              <select id="mw-sound">${soundOptions(mwLastSound || ensureVoicePick().sound)}</select>
            </label>
            <div class="field">Picture
              <div class="pic-row">
                <input type="text" id="mw-emoji" class="emoji-in" maxlength="12" autocomplete="off" placeholder="Emoji, e.g. 🐶">
                <span class="or">or</span>
                <label class="photo-btn">📷 Photo<input type="file" id="mw-photo" accept="image/*" class="vh"></label>
                <span id="mw-preview" class="mw-preview"></span>
              </div>
            </div>
            <button class="pill main" data-act="mw-add">➕ Add word</button>
          </div>
          <label class="toggle"><input type="checkbox" data-set="mixMine" ${st.mixMine ? "checked" : ""}>
            Mix My words into his rounds (about 1 in 3 words)</label>
          <p class="note">Each sound with My words also gets a "⭐ My words" level, to practise only those.</p>
          <div id="mw-list">${myListHTML()}</div>
        </section>

        <section class="panel">
          <h2>🎙️ Grown-up voice</h2>
          <p class="note">Record yourself (or his mom) saying the words, and he'll hear your voice instead of the iPad
            voice. Say each word clearly and a little slowly, and lean on the target sound ("rrrabbit", "toaD").
            Recordings are saved on this iPad only. Talking speed only changes the iPad voice.</p>
          <label class="toggle"><input type="checkbox" data-set="useMyVoice" ${st.useMyVoice ? "checked" : ""}>
            Play grown-up recordings when there is one</label>
          <div id="voice-box">${voiceBoxHTML()}</div>
        </section>

        <section class="panel" id="sounds-panel">
          <h2>Sounds &amp; levels</h2>
          <p class="note">On his home screen now:</p>
          <div class="chips">${soundsSummary}</div>
          <button class="pill main" data-act="sounds-menu" style="align-self:flex-start">🔤 Choose sounds &amp; levels (${Object.keys(SOUNDS).length} sounds) ›</button>
        </section>

        <section class="panel">
          <h2>⏱️ Practice time</h2>
          <p class="note">A timed session in short blocks, like a speech therapy session. He listens first, then has
            his turn, gets a wiggle break and a sticker, has another turn, then opens a present. If you pick two sounds,
            he does one before the break and one after. Tap ⏸️ at any time to stop the timer.</p>
          <div class="field">Length
            ${radioGroup("sessionMins", [[5, "5 min"], [10, "10 min"], [15, "15 min"]], sessionMins())}
            <span class="note" id="plan-note">${esc(planText(sessionMins()))}</span>
          </div>
          <label class="toggle"><input type="checkbox" data-set="sessionBtn" ${st.sessionBtn ? "checked" : ""}>
            Show the ⏱️ Practice time button on his home screen</label>
          <div class="field">Warn before each change
            ${radioGroup("warnWords", [[0, "Off"], [1, "1 word"], [2, "2 words"], [3, "3 words"]], st.warnWords)}
            <span class="note">When the time is up, he finishes a few more words first and hears "Two more, then break time!".
              The top bar shows them as dots: ● ● 🎈. Changes he can see coming are easier.</span>
          </div>
          <div class="field">Tries goal for each Practice time
            ${radioGroup("triesGoal", [[0, "None"], [50, "50"], [75, "75"], [100, "100"]], st.triesGoal)}
            <span class="note">The count shows next to "Grown-up" during Practice time and in Progress. Research sessions
              often aim for about 100 tries, but ask his speech therapist what suits him.</span>
          </div>
          <p class="note">Ask his speech therapist how long home practice should be. Short, regular practice usually works best.</p>
        </section>

        <section class="panel">
          <h2>🔧 Build-it</h2>
          <p class="note">A game for asking. He picks something to build (robot, rocket, train, fire truck, bathroom, cake),
            then taps a part he wants. He gets it by asking for it: you tap ✅ <b>He asked!</b> Any real try at his level counts,
            and the iPad says it back ("Here's the wheel!"). It's about asking, not perfect speech.</p>
          <div class="field">How he asks
            ${radioGroup("buildLevel", [["word", "“wheel”"], ["want", "“want wheel”"], ["iwant", "“I want the wheel”"],
              ["please", "“Can I have the wheel, please?”"]], st.buildLevel)}
            <span class="note">Choose one step longer than he usually says now. Move up when he asks this way easily.</span>
          </div>
          <div class="field">Helping him
            ${radioGroup("buildModel", [["first", "Say it for him straight away"], ["wait", "Wait 5 seconds first"]], st.buildModel)}
            <span class="note">Waiting gives him a chance to ask on his own: look at him and wait expectantly.
              Use "straight away" while the game is new, and "wait" once he knows it.</span>
          </div>
          <label class="toggle"><input type="checkbox" data-set="buildBtn" ${st.buildBtn ? "checked" : ""}>
            Show the 🔧 Build button on his home screen</label>
          <p class="note">Try it at home too: keep a snack or a toy piece in your hand until he asks for it, then give it straight away.</p>
        </section>

        <section class="panel">
          <h2>Game settings</h2>
          <div class="field">Words per round
            ${radioGroup("perRound", [[3, "3"], [5, "5"], [8, "8"]], st.perRound)}
          </div>
          <div class="field">Talking speed
            ${radioGroup("rate", [[0.6, "Slow"], [0.75, "Medium"], [0.95, "Normal"]], st.rate)}
          </div>
          <label class="toggle"><input type="checkbox" data-set="autoSay" ${st.autoSay ? "checked" : ""}>
            Say each word out loud when it appears</label>
          <label class="toggle"><input type="checkbox" data-set="mic" ${st.mic ? "checked" : ""}>
            Use the microphone (My turn / Hear me)</label>
          <label class="toggle"><input type="checkbox" data-set="handsFree" ${st.handsFree ? "checked" : ""}>
            Hands-free: after the word is said, listen for him by itself (no need to tap My turn).
            It stops when he goes quiet, or after 6 seconds if he says nothing.</label>
          <label class="toggle"><input type="checkbox" data-set="kidStop" ${st.kidStop ? "checked" : ""}>
            <span>Show his own ✋ <b>Break</b> and 👋 <b>All done</b> buttons on the card. Either one pauses so you can choose
            what to do. Honour them: it teaches him that asking works.</span></label>
          <label class="toggle"><input type="checkbox" data-set="autoHear" ${st.autoHear ? "checked" : ""}>
            Play his voice back by itself after each try. Turn off for quicker tries (👂 Hear me still works).</label>
          <label class="toggle"><input type="checkbox" data-set="quiet" ${st.quiet ? "checked" : ""}>
            <span>🤫 <b>Quiet mode</b>: no sound effects, no bouncing or pulsing, and a softer voice.
            Also on the pause screen, for when it gets too much.</span></label>
          <label class="toggle"><input type="checkbox" data-set="sfx" ${st.sfx ? "checked" : ""}>
            Sound effects (chimes, flush, animal and vehicle sounds)</label>
          <div class="field">Sound effects volume
            ${radioGroup("fxVol", [[0.35, "Soft"], [0.65, "Medium"], [1, "Full"]], st.fxVol)}
          </div>
          <div class="field">Sound on ⭐ Great (chime or flush)
            ${radioGroup("greatFx", [["every", "Every time"], ["third", "Every 3rd"], ["none", "Only at the present"]], st.greatFx)}
          </div>
          <label class="toggle"><input type="checkbox" data-set="realSounds" ${st.realSounds ? "checked" : ""}>
            Real recorded sounds: stickers moo, whistle and beep when he finds them or taps them in his book.
            Turn off if any are too much for him.</label>
          <details class="sfx-test"><summary>🔊 Test the sound effects</summary>
            <p class="note">Tap to hear each one. These play even when the switches above are off.</p>
            <div class="sfx-grid">${Object.entries(SFX).map(([k, label]) =>
              `<button class="pill" data-act="sfx-test" data-k="${k}">${esc(label)}</button>`).join("")}</div>
          </details>
          <label class="toggle"><input type="checkbox" data-set="voiceMeter" ${st.voiceMeter ? "checked" : ""}>
            Big-voice meter while recording (encourages talking out loud instead of whispering)</label>
          <div class="field">How loud counts as a big voice
            ${radioGroup("voiceLevel", [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]], st.voiceLevel)}
            <span class="note">If the meter never fills when he talks in a normal voice, choose Easy.</span>
          </div>
          <button class="pill" data-act="test-voice" style="align-self:flex-start">🔊 Test the voice</button>
        </section>

        <section class="panel">
          <h2>🎙️ Voice report (optional)</h2>
          <p class="note">Keep his tries so a report tool on your computer can listen to them and write a report on how he did.
            Each try is saved on this iPad with only the word he was practising, the sound and level, your ⭐ or 🔁 and the day.
            No name and no device details, and <b>My words are never saved</b> (they can include family names).
            In Build-it, it also records him while he asks. Ask his parents first: it's his voice.</p>
          <label class="toggle"><input type="checkbox" data-set="saveTries" ${st.saveTries ? "checked" : ""}>
            <span>Save his tries for a voice report</span></label>
          <p class="note" id="tries-saved">Counting saved tries…</p>
          <div class="actions" style="justify-content:flex-start">
            <button class="pill" data-act="tries-export">📤 Export for report</button>
            <button class="pill danger" data-act="tries-delete">🗑 Delete saved tries</button>
          </div>
          <p class="note">Export makes one .zip file and opens the Share menu. Get it to the <b>inbox</b> folder
            inside <b>Super Sounds Reports</b> on your computer (USB cable, or a cloud drive folder that syncs to the computer),
            then run <b>/speech-report</b> in Claude there. Delete the tries here once the report is made.</p>
        </section>

        <section class="panel">
          <h2>Progress</h2>
          ${statsHTML()}
        </section>

        <section class="panel">
          <h2>Privacy &amp; reset</h2>
          <p class="note">Everything stays on this iPad. His own recordings are not saved: each one is deleted as
            soon as he moves to the next word, unless you turn on 🎙️ Voice report. Then his tries stay on this iPad until you export or delete them. Grown-up recordings and My words photos are kept on this iPad until
            you delete them (deleting the app from the Home Screen erases them too). No accounts, ads or tracking.</p>
          <div class="actions" style="justify-content:flex-start">
            <button class="pill danger" data-act="reset-progress">Reset progress &amp; stars</button>
            <button class="pill danger" data-act="reset-stickers">Reset stickers</button>
            <button class="pill danger" data-act="reset-voices">Delete all grown-up recordings</button>
          </div>
        </section>
      </div>`;
  }

  function applySetting(el) {
    const st = S();
    const key = el.dataset.set;
    switch (key) {
      case "name": st.name = el.value.slice(0, 24); break;
      case "theme": st.theme = el.value; break;
      case "perRound": st.perRound = Number(el.value); break;
      case "rate": st.rate = Number(el.value); break;
      case "autoSay": case "mic": case "sfx": case "voiceMeter": case "useMyVoice": case "mixMine": case "handsFree": case "realSounds":
      case "kidStop": case "autoHear": case "buildBtn": case "saveTries":
        st[key] = el.checked; break;
      case "quiet": st.quiet = el.checked; applyQuiet(); break;
      case "warnWords": case "triesGoal": case "fxVol": st[key] = Number(el.value); break;
      case "greatFx": st.greatFx = el.value; break;
      case "buildLevel": case "buildModel": st[key] = el.value; break;
      case "voiceLevel": st.voiceLevel = el.value; break;
      case "sessionMins": {
        st.sessionMins = Number(el.value);
        const n = document.getElementById("plan-note");
        if (n) n.textContent = planText(sessionMins());
        break;
      }
      case "sessionBtn": st.sessionBtn = el.checked; break;
      case "sound-on":
        st.sounds[el.dataset.sound].on = el.checked;
        if (screen === "sounds") { save(); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
        break;
      case "sound-level": {
        st.sounds[el.dataset.sound].level = el.value;
        const hint = document.getElementById("hint-" + el.dataset.sound);
        const lv = findLevel(el.dataset.sound, el.value);
        if (hint && lv) hint.textContent = "e.g. " + lv.hint;
        break;
      }
    }
    save();
  }

  // =================================================================
  //  Events
  // =================================================================
  const actions = {
    start: (b) => startRound(b.dataset.sound),
    home: () => show("home"),
    "sounds-menu": () => show("sounds"),
    "s-open": () => openSessionPick(),
    "s-pick": (b) => togglePick(b.dataset.sound),
    "s-start": () => startSession(),
    "s-pause": () => pauseAny("pause"),
    "s-resume": () => resumeAny(),
    "s-finish": () => finishAny(),
    "kid-break": () => pauseAny("break"),
    "b-open": () => openBuildPick(),
    "b-kit": (b) => startBuild(b.dataset.kit),
    "b-part": (b) => pickPart(Number(b.dataset.i)),
    "b-give": () => givePart(),
    "b-say": () => modelPart(),
    "b-gift": () => finishBuild(),
    "tries-export": () => exportTries(),
    "tries-delete": async () => {
      let n = 0;
      try { n = (await idbKeys("tries")).length; } catch (e) {}
      if (!n) { toast("No saved tries."); return; }
      if (confirm(`Delete all ${n} saved tries from this iPad? Export them first if you want a report. This can't be undone.`)) {
        try { await idbClear("tries"); } catch (e) {}
        savedFull = false;
        refreshTriesCount();
        toast("Saved tries deleted.");
      }
    },
    "kid-done": () => pauseAny("done"),
    quiet: () => {
      S().quiet = !S().quiet;
      save();
      applyQuiet();
      app.querySelectorAll('[data-act="quiet"]').forEach((b) => { b.outerHTML = quietBtnHTML(); });
    },
    "warm-again": () => { if (session) { session.tok++; warmSay(); } },
    "warm-next": () => warmNext(),
    "block-skip": () => { if (session) { session.tok++; stopSpeaking(); nextBlock(); } },
    "brk-open": () => openBreakGift(),
    "brk-go": () => { if (session && screen === "brk") nextBlock(); },
    "grown-back": () => show("grown"),
    book: () => show("book"),
    listen: () => { player.pause(); sayCurrent(); },
    "coach-say": () => { player.pause(); sayModel(); },
    mirror: () => toggleMirror(),
    record: () => (rec.state === "recording" ? stopRecording()
      : rec.state === "listening" ? switchToManual() : startRecording()),
    hear: () => playBack(),
    great: onGreat,
    again: onAgain,
    skip: onSkip,
    open: openGift,
    "again-round": () => startRound(round.sound),
    "test-voice": () => say("Hi! Let's practise. Boat. Lion. Fish."),
    "sfx-test": (b) => playSfx(b.dataset.k, true),
    "sticker-sound": (b) => {
      playSfx(stickerSfx(b.dataset.e));
      b.classList.remove("wiggle");
      void b.offsetWidth;
      b.classList.add("wiggle");
    },
    "reset-progress": () => {
      if (confirm("Reset all progress and stars? Stickers are kept.")) {
        data.stats = {}; data.days = {}; data.stars = 0; save(); render(); toast("Progress reset.");
      }
    },
    "mw-add": () => addMyWord(),
    "mw-del": (b) => deleteMyWord(b.dataset.id),
    "mw-clear-photo": () => clearPendingPhoto(),
    vrec: (b) => (gRec.key ? stopGrownRecord() : startGrownRecord(b.dataset.key)),
    vplay: (b) => previewVoice(b.dataset.key),
    vdel: (b) => deleteVoice(b.dataset.key),
    "reset-voices": () => {
      if (confirm("Delete every grown-up recording on this iPad? This can't be undone.")) {
        stopSpeaking();
        idbClear("audio").catch(() => {});
        voices.keys.clear();
        voices.buffers.clear();
        refreshVoiceBox();
        toast("Grown-up recordings deleted.");
      }
    },
    "reset-stickers": () => {
      if (confirm("Remove all collected stickers?")) {
        data.stickers = {}; save(); render(); toast("Stickers reset.");
      }
    },
  };

  app.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const fn = actions[b.dataset.act];
    if (fn) fn(b);
  });

  app.addEventListener("change", (e) => {
    if (e.target.id === "mw-photo") { onPhotoPicked(e.target); return; }
    const vp = e.target.closest("[data-vp]");
    if (vp) {
      const p = ensureVoicePick();
      if (vp.dataset.vp === "sound") { p.sound = vp.value; p.level = S().sounds[vp.value].level; }
      else p.level = vp.value;
      refreshVoiceBox();
      return;
    }
    const el = e.target.closest("[data-set]");
    if (el) applySetting(el);
  });
  app.addEventListener("input", (e) => {
    const el = e.target.closest('[data-set="name"]');
    if (el) applySetting(el);
  });

  // Press-and-hold for the Grown-ups area (keeps little fingers out).
  let holdTimer = null, holdBtn = null;
  function endHold() {
    clearTimeout(holdTimer);
    if (holdBtn) holdBtn.classList.remove("holding");
    holdBtn = null;
  }
  app.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("[data-hold]");
    if (!b) return;
    e.preventDefault();
    holdBtn = b;
    b.classList.add("holding");
    holdTimer = setTimeout(() => { const t = b.dataset.hold; endHold(); show(t); }, HOLD_MS);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    app.addEventListener(ev, (e) => { if (holdBtn && (ev !== "pointerleave" || e.target === holdBtn)) endHold(); }, true));
  app.addEventListener("click", (e) => {
    if (e.target.closest("[data-hold]")) toast("Grown-ups: press and hold for 2 seconds.");
  });
  app.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-hold]")) e.preventDefault(); });

  // Stop the mic and voice if the app goes to the background.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (inSession()) { pauseKind = "pause"; pauseSession(); }
      if (screen === "build" && build && !build.paused && !build.done) pauseAny("pause");
      stopSpeaking();
      if (rec.state === "listening") { resetRecording(); updateKidRow(); }
      else if (rec.state === "recording") stopRecording();
      stopGrownRecord();
      stopMirror();
    }
  });

  // =================================================================
  //  Start
  // =================================================================
  applyQuiet();
  render();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
