/* Super Sounds — game logic. Plain JavaScript, no build step. */
(() => {
  "use strict";

  const SOUNDS = window.SOUNDS;
  const LEVELS = window.LEVELS;
  const THEMES = window.THEMES;
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");

  const MAX_TRIES = 3;          // after this many "Again" taps, move on gently
  const RECORD_SECONDS = 4;     // recording stops by itself after this
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
  };

  function loadData() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    const s = d.settings || {};
    d.settings = Object.assign({}, DEFAULT_SETTINGS, s);
    d.settings.sounds = {};
    for (const k of Object.keys(SOUNDS)) {
      const saved = (s.sounds || {})[k] || {};
      const level = LEVELS.some((l) => l.id === saved.level) ? saved.level : "start";
      d.settings.sounds[k] = { on: saved.on !== false, level };
    }
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

  function say(text, onEnd) {
    if (!canSpeak) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-US";
    u.rate = S().rate;
    u.pitch = 1.05;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
  }

  function stopSpeaking() { if (canSpeak) speechSynthesis.cancel(); }

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
  //  Recording (kept in memory only, thrown away after each word)
  // =================================================================
  const rec = { mr: null, stream: null, chunks: [], url: null, timer: null, state: "idle", token: 0 };
  const player = new Audio();
  player.setAttribute("playsinline", "");

  const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  async function startRecording() {
    if (!canRecord()) { toast("Recording isn't available on this device."); return; }
    stopSpeaking();
    player.pause();
    const token = ++rec.token;
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
      stopStream();
      if (token !== rec.token) return;
      if (rec.url) URL.revokeObjectURL(rec.url);
      const blob = new Blob(rec.chunks, { type: (rec.mr && rec.mr.mimeType) || type || "audio/mp4" });
      rec.url = blob.size ? URL.createObjectURL(blob) : null;
      rec.state = rec.url ? "done" : "idle";
      updateKidRow();
      if (rec.url) playBack();
    };
    rec.mr.start();
    rec.state = "recording";
    updateKidRow();
    rec.timer = setTimeout(stopRecording, RECORD_SECONDS * 1000);
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
    if (rec.mr && rec.mr.state === "recording") { try { rec.mr.stop(); } catch (e) {} }
    rec.mr = null;
    stopStream();
    player.pause();
    player.removeAttribute("src");
    if (rec.url) URL.revokeObjectURL(rec.url);
    rec.url = null;
    rec.state = "idle";
  }

  function playBack() {
    if (!rec.url) return;
    stopSpeaking();
    player.src = rec.url;
    const hear = app.querySelector('[data-act="hear"]');
    hear && hear.classList.add("active");
    player.onended = player.onpause = () => hear && hear.classList.remove("active");
    player.play().catch(() => hear && hear.classList.remove("active"));
  }

  // =================================================================
  //  Screens
  // =================================================================
  let screen = "home";
  let round = null;      // the current practice round
  let reward = null;     // the sticker just earned

  function show(name) {
    if (screen === "play" && name !== "play") { resetRecording(); stopSpeaking(); }
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
          <span class="tile-letter">${esc(s.label)}</span>
          <span class="tile-text">${esc(s.cueText)}</span>
        </button>`;
    }).join("");

    app.innerHTML = `
      <div class="screen home">
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
  function statKey(sound, level, item) { return `${sound}|${level}|${item.w}`; }

  // Pick words for a round. Words he finds tricky come up a bit more often.
  function pickWords(sound, level, n) {
    const pool = SOUNDS[sound].levels[level] || [];
    if (!pool.length) return [];
    const weighted = pool.map((item) => {
      const st = data.stats[statKey(sound, level, item)];
      const tricky = st && st.t >= 2 && st.g / st.t < 0.5;
      return { item, w: Math.random() * (tricky ? 1.6 : 1) };
    }).sort((a, b) => b.w - a.w).map((x) => x.item);
    const out = [];
    while (out.length < n) out.push(...(out.length ? shuffle(pool) : weighted));
    return out.slice(0, n);
  }

  function startRound(sound) {
    const level = S().sounds[sound].level;
    const items = pickWords(sound, level, S().perRound);
    if (!items.length) { toast("No words for this level yet."); return; }
    round = { sound, level, items, idx: 0, tries: 0, greats: 0, busy: false };
    show("play");
    if (S().autoSay) sayCurrent(); // called inside the tap so iOS allows it
  }

  const currentItem = () => round.items[round.idx];

  function sayCurrent() {
    const item = currentItem();
    const btn = app.querySelector('[data-act="listen"]');
    btn && btn.classList.add("active");
    say(item.say || item.w, () => btn && btn.classList.remove("active"));
  }

  // ---------- Play ----------
  function renderPlay() {
    const s = SOUNDS[round.sound];
    const item = currentItem();
    const lvl = LEVELS.find((l) => l.id === round.level);
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
        <main class="card" aria-label="${esc(lvl ? lvl.name : "")}">
          <div class="pic" aria-hidden="true">${item.p}</div>
          <div class="word ${long ? "long" : ""}">${highlight(item.w, s.highlight)}</div>
          <div class="msg" id="msg" aria-live="polite"></div>
        </main>
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
  }

  function updateKidRow() {
    if (screen !== "play") return;
    const recBtn = app.querySelector('[data-act="record"]');
    const hear = app.querySelector('[data-act="hear"]');
    if (!recBtn) return;
    const lbl = recBtn.querySelector(".lbl");
    recBtn.classList.toggle("rec", rec.state === "recording");
    recBtn.disabled = rec.state === "starting";
    lbl.textContent = rec.state === "recording" ? "Stop" : "My turn";
    hear.disabled = !rec.url || rec.state === "recording";
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
    chime("small");
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
      setMsg("Good trying! Listen again 👂");
      setTimeout(() => { if (screen === "play") sayCurrent(); }, 500);
    }
  }

  function onSkip() {
    if (round.busy) return;
    round.busy = true;
    nextWord();
  }

  function nextWord() {
    if (screen !== "play") return;
    resetRecording();
    round.idx++;
    round.tries = 0;
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
    chime("big");
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
      for (const lv of LEVELS) {
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

  function renderGrown() {
    const st = S();
    const soundCards = Object.entries(SOUNDS).map(([k, s]) => `
      <div class="sound-card" style="${soundVars(k)}">
        <h3><span>${s.cue}</span> ${esc(s.label)} sound</h3>
        <label class="toggle"><input type="checkbox" data-set="sound-on" data-sound="${k}"
          ${st.sounds[k].on ? "checked" : ""}> Show this sound on the home screen</label>
        <label class="field">Level
          <select data-set="sound-level" data-sound="${k}">
            ${LEVELS.map((l) => `<option value="${l.id}" ${l.id === st.sounds[k].level ? "selected" : ""}>
              ${esc(l.name)} — ${esc(l.hint)} (${(s.levels[l.id] || []).length} items)</option>`).join("")}
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
          <label class="toggle"><input type="checkbox" data-set="sfx" ${st.sfx ? "checked" : ""}>
            Gentle chimes</label>
          <button class="pill" data-act="test-voice" style="align-self:flex-start">🔊 Test the voice</button>
        </section>

        <section class="panel">
          <h2>Progress</h2>
          ${statsHTML()}
        </section>

        <section class="panel">
          <h2>Privacy &amp; reset</h2>
          <p class="note">Everything stays on this iPad. Recordings are never saved: each one is deleted as soon
            as he moves to the next word. No accounts, ads or tracking.</p>
          <div class="actions" style="justify-content:flex-start">
            <button class="pill danger" data-act="reset-progress">Reset progress &amp; stars</button>
            <button class="pill danger" data-act="reset-stickers">Reset stickers</button>
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
      case "autoSay": case "mic": case "sfx": st[key] = el.checked; break;
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
    record: () => (rec.state === "recording" ? stopRecording() : startRecording()),
    hear: () => playBack(),
    great: onGreat,
    again: onAgain,
    skip: onSkip,
    open: openGift,
    "again-round": () => startRound(round.sound),
    "test-voice": () => say("Hi! Let's practise. Rabbit. Chair. Lion."),
    "reset-progress": () => {
      if (confirm("Reset all progress and stars? Stickers are kept.")) {
        data.stats = {}; data.days = {}; data.stars = 0; save(); render(); toast("Progress reset.");
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
      if (rec.state === "recording") stopRecording();
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
