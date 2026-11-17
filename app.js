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
    handsFree: false,   // start listening by itself after the word is said
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
        const req = indexedDB.open("superSounds", 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("audio")) d.createObjectStore("audio");
          if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos");
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

  function chime(kind = "small") {
    if (!S().sfx) return;
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
      o.connect(g).connect(ctx.destination);
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
    if (!S().sfx) return;
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
    src.connect(bp).connect(g).connect(ctx.destination);
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
      o.connect(og).connect(ctx.destination);
      o.start(s);
      o.stop(s + 0.12);
    });
  }

  // Toilet theme: a quick whoosh when the present opens.
  function whoosh() {
    if (!S().sfx) return;
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
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.6);
  }

  // The "well done" sound for the current sticker theme.
  function greatSound() {
    if (theme().sfx === "flush") flush(); else chime("small");
  }

  // iOS only allows sound after the first touch — unlock both on first tap.
  document.addEventListener("pointerdown", function unlock() {
    audioCtx();
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
    src.connect(ctx.destination);
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
      rec.clip = null;
      rec.state = rec.url ? "done" : "idle";
      updateKidRow();
      if (!rec.url) return;
      // Trim the silence before he spoke so "Hear me" starts right at his word.
      const ctx = audioCtx();
      if (!ctx || !blob.arrayBuffer) { playBack(); return; }
      blob.arrayBuffer()
        .then((ab) => decodeAudio(ctx, ab))
        .then((b) => { if (token === rec.token) rec.clip = tidyClip(ctx, b); })
        .catch(() => {})
        .then(() => { if (token === rec.token && rec.url) playBack(); });
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
    screen = name;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    ({ home: renderHome, play: renderPlay, reward: renderReward, book: renderBook, grown: renderGrown })[screen]();
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
          <button class="pill" data-act="book">📖 Sticker book</button>
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
    const level = S().sounds[sound].level;
    const items = pickWords(sound, level, S().perRound);
    if (!items.length) { toast("No words for this level yet."); return; }
    round = { sound, level, items, idx: 0, tries: 0, greats: 0, busy: false, sayTok: 0, coach: 0 };
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
    const item = currentItem();
    const btn = app.querySelector('[data-act="listen"]');
    btn && btn.classList.add("active");
    const step = round.coach || 0;
    const c = coachOf(round.sound);
    const parts = [];
    if (step >= 2) parts.push(c.model ? { text: c.model, say: c.modelSay } : { text: item.w, say: item.say });
    else if (item.pair) parts.push({ text: item.pair });
    parts.push({ text: item.w, say: item.say });
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
        <header class="topbar">
          <button class="icon-btn" data-act="home" aria-label="Stop and go home">🏠</button>
          <div class="dots" aria-label="Word ${round.idx + 1} of ${round.items.length}">${dots}</div>
          <div class="stars" aria-label="${data.stars} stars">⭐ ${data.stars}</div>
        </header>
        <div class="cue">${s.cue} ${esc(s.label)} · ${esc(s.cueText)}</div>
        <main class="card ${item.pair ? "has-pair" : ""} ${mic && S().voiceMeter ? "has-meter" : ""}" aria-label="${esc(lvl ? lvl.name : "")}">
          ${item.pair ? `<div class="pair"><span aria-hidden="true">${item.pp}</span> ${esc(item.pair)} <span class="arrow">➜</span></div>` : ""}
          <div class="pic" aria-hidden="true">${picHTML(item)}</div>
          <video class="mirror-video" id="mirror-video" playsinline muted autoplay aria-label="Mirror"></video>
          <div class="word ${long ? "long" : ""}">${highlightItem(round.sound, item)}</div>
          ${mic && S().voiceMeter ? `<div class="meter hidden" aria-hidden="true">
            <span>🔈</span><div class="meter-track"><div class="meter-fill"></div></div><span>📣</span></div>` : ""}
          <div class="msg" id="msg" aria-live="polite"></div>
        </main>
        <section class="coach" id="coach" aria-label="How to make the sound" ${round.coach ? "" : "hidden"}>${round.coach ? coachHTML() : ""}</section>
        <section class="kid-row ${mic ? "" : "two"}">
          <button class="big-btn" data-act="listen"><span class="ico">🔊</span>Listen</button>
          ${mic ? `
          <button class="big-btn" data-act="record"><span class="ico">🎤</span><span class="lbl">My turn</span></button>
          <button class="big-btn" data-act="hear" disabled><span class="ico">👂</span>Hear me</button>` : ""}
        </section>
        <section class="grown-row" aria-label="Grown-up buttons">
          <span class="label">Grown-up:</span>
          <button class="judge great" data-act="great">⭐ Great!</button>
          <button class="judge again" data-act="again">🔁 Again</button>
          <button class="judge skip" data-act="skip">Skip ➜</button>
        </section>
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
    save();
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
    greatSound();
    setTimeout(nextWord, 1100);
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
    resetRecording();
    round.idx++;
    round.tries = 0;
    round.coach = 0;
    stopMirror();
    round.busy = false;
    if (round.idx >= round.items.length) { finishRound(); return; }
    render();
    if (S().autoSay) setTimeout(() => { if (screen === "play") sayCurrent(); }, 350);
  }

  function finishRound() {
    const dk = dayKey();
    data.days[dk] = (data.days[dk] || 0) + 1;
    const th = theme();
    const have = collected();
    const left = th.stickers.filter((x) => !have.includes(x));
    if (left.length) {
      const sticker = left[Math.floor(Math.random() * left.length)];
      have.push(sticker);
      reward = { sticker, isNew: true, complete: left.length === 1 };
    } else {
      reward = { sticker: th.stickers[Math.floor(Math.random() * th.stickers.length)], isNew: false, complete: true };
    }
    save();
    show("reward");
    chime("big");
  }

  // ---------- Reward ----------
  function renderReward() {
    const th = theme();
    const name = S().name.trim();
    const g = round ? round.greats : 0;
    app.innerHTML = `
      <div class="screen reward">
        <div class="mascot bob" aria-hidden="true">${th.mascot}</div>
        <h1>You did it${name ? ", " + esc(name) : ""}!</h1>
        <p class="sub">${g ? `You got ${"⭐".repeat(Math.min(g, 10))}` : "Great practising!"}</p>
        <button class="gift" data-act="open" aria-label="Open your present">🎁<small>Tap to open!</small></button>
        <div class="opened hidden">
          <div class="new-sticker" aria-hidden="true">${reward.sticker}</div>
          <p class="sub">${reward.isNew
            ? (reward.complete ? "You found ALL the stickers! 🎉" : "A new sticker for your book!")
            : "You have every sticker! Amazing!"}</p>
        </div>
        <div class="actions hidden">
          <button class="pill main" data-act="again-round">🔁 Play again</button>
          <button class="pill" data-act="book">📖 Sticker book</button>
          <button class="pill" data-act="home">🏠 Home</button>
        </div>
      </div>`;
  }

  function openGift() {
    app.querySelector(".gift").classList.add("hidden");
    app.querySelector(".opened").classList.remove("hidden");
    app.querySelector(".actions").classList.remove("hidden");
    if (theme().sfx === "flush") { whoosh(); setTimeout(() => chime("big"), 350); } else chime("big");
  }

  // ---------- Sticker book ----------
  function renderBook() {
    const th = theme();
    const have = collected();
    const slots = th.stickers.map((x) => have.includes(x)
      ? `<div class="slot">${x}</div>`
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
    let days = 0, rounds = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const n = data.days[dayKey(d)] || 0;
      if (n) { days++; rounds += n; }
    }
    return `
      <p><b>This week:</b> practised on ${days} of the last 7 days (${rounds} round${rounds === 1 ? "" : "s"}).
         <b>Stars:</b> ${data.stars}. <b>Stickers:</b> ${collected().length} of ${theme().stickers.length}.</p>
      ${rows.length ? `<table>
        <thead><tr><th>Sound</th><th>Level</th><th>Tries</th><th>Great</th></tr></thead>
        <tbody>${rows.join("")}</tbody></table>` : `<p class="note">No practice recorded yet.</p>`}
      ${tricky.length ? `<h3>Tricky words</h3><ul>${tricky.join("")}</ul>` : ""}
      <p class="note">"Tries" counts every Great or Again tap. Skips aren't counted.</p>`;
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

  function renderGrown() {
    const st = S();
    const soundCards = Object.entries(SOUNDS).map(([k, s]) => `
      <div class="sound-card" style="${soundVars(k)}">
        <h3><span>${s.cue}</span> ${esc(s.label)}${s.label.length > 2 ? "" : " sound"}</h3>
        <label class="toggle"><input type="checkbox" data-set="sound-on" data-sound="${k}"
          ${st.sounds[k].on ? "checked" : ""}> Show this sound on the home screen</label>
        <label class="field">Level
          <select data-set="sound-level" data-sound="${k}">
            ${levelsOf(k).map((l) => `<option value="${l.id}" ${l.id === st.sounds[k].level ? "selected" : ""}>
              ${esc(l.name)} — ${esc(l.hint)} (${l.items.length} items)</option>`).join("")}
          </select>
        </label>
        <details><summary>How to coach the ${esc(s.label)} sound</summary><p>${esc(s.tip)}</p></details>
      </div>`).join("");

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
          </ol>
          <p class="note">Keep sessions short (1–3 rounds) and stop while it's still fun. Judge only the target sound,
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

        <section class="panel">
          <h2>Sounds &amp; levels</h2>
          ${soundCards}
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
          <label class="toggle"><input type="checkbox" data-set="sfx" ${st.sfx ? "checked" : ""}>
            Gentle chimes</label>
          <label class="toggle"><input type="checkbox" data-set="voiceMeter" ${st.voiceMeter ? "checked" : ""}>
            Big-voice meter while recording (encourages talking out loud instead of whispering)</label>
          <div class="field">How loud counts as a big voice
            ${radioGroup("voiceLevel", [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]], st.voiceLevel)}
            <span class="note">If the meter never fills when he talks in a normal voice, choose Easy.</span>
          </div>
          <button class="pill" data-act="test-voice" style="align-self:flex-start">🔊 Test the voice</button>
        </section>

        <section class="panel">
          <h2>Progress</h2>
          ${statsHTML()}
        </section>

        <section class="panel">
          <h2>Privacy &amp; reset</h2>
          <p class="note">Everything stays on this iPad. His own recordings are never saved: each one is deleted as
            soon as he moves to the next word. Grown-up recordings and My words photos are kept on this iPad until
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
      case "autoSay": case "mic": case "sfx": case "voiceMeter": case "useMyVoice": case "mixMine": case "handsFree":
        st[key] = el.checked; break;
      case "voiceLevel": st.voiceLevel = el.value; break;
      case "sound-on": st.sounds[el.dataset.sound].on = el.checked; break;
      case "sound-level": st.sounds[el.dataset.sound].level = el.value; break;
    }
    save();
  }

  // =================================================================
  //  Events
  // =================================================================
  const actions = {
    start: (b) => startRound(b.dataset.sound),
    home: () => show("home"),
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
  render();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
