# Change log

Every change to Super Sounds, newest first. The version number matches `VERSION` in [sw.js](sw.js),
so you can tell which version an iPad is running.

## v21 · 2026-11-24 · 🤖 Robot buddy
- A friendly robot sits in the corner of the word card (on by default; Grown-ups → 🤖 Robot buddy).
- **Every word charges its core**, whether he got ⭐ Great, used up his tries, or the word was skipped, so trying is
  what counts.
- **⭐ Great makes it talk:** a short line in a robot voice, full of sounds he practises ("Let's go!", "Ten out of ten!",
  "Level up!"). After 🔁 Again it shows a thinking face and "You can do it!" without talking over the coaching.
- **Full power:** when the core is full (end of a round, or every 5 words in Practice time) he picks what it does:
  💥 **Pop** (its parts spring off and snap back together), 🚀 **Fly** or 💃 **Dance**. It never breaks for good,
  catches fire or gets taken away.
- Grown-ups → 🤖 Robot buddy counts his picks, to show whether the big Pop moment or just having a choice is
  what he likes. Pop can be switched off. Quiet mode turns off its sounds and movement.

## v20 · 2026-11-20 · Video call: QR code, mute and notes
- **QR code:** while his iPad waits for someone to join, Grown-ups → 📹 Video call shows a **QR code** of the call link.
  The other grown-up can scan it with their phone's camera instead of being sent the link.
- **🎙️ Mute me** on the grown-up's call screen turns their microphone off and on. He can still be heard.
- **📝 Notes** on the grown-up's call screen: type notes during the call. Each one is tagged with the time and the word
  he's on, and the ⭐ / 🔁 / Skip taps are counted per word as a summary. **📤 Share notes** sends them as text (or saves a
  .txt file). Notes from earlier calls are kept under 🗂 Earlier calls. They stay on that grown-up's device and are never
  sent to his iPad.

## v19 · 2026-11-19 · 📹 Video call and 🎬 Star clips
- **📹 Video call.** His iPad and a grown-up somewhere else can see and hear each other. Grown-ups → 📹 Video call →
  Start video call → Send the link; the grown-up opens it on any phone, tablet or computer and taps Join.
  - On his iPad the grown-up appears in a **small window in the corner**; tap it to make it bigger (with his own picture and an End button).
  - The grown-up's screen shows him on video, the word with the target sound highlighted, a coaching tip, and
    **⭐ Great / 🔁 Again / Skip**. They can start a round, Practice time or Build-it, pause, finish, and turn on Quiet mode,
    and they get an alert when he taps ✋ Break or 👋 All done. His iPad hides its grown-up buttons during a call.
  - Live only: nothing is recorded. The devices connect directly (encrypted); a free public service (PeerJS) introduces them.
    No account needed. Anyone with the link can join while the iPad is waiting; "Make a new link" stops old links working.
- **🎬 Star clips** (off by default). Records video while he says each word and keeps the ⭐ Great ones on the iPad.
  - **Watch yourself:** next time the word comes up, a 🎬 Watch me button plays his own ⭐ clip, or (setting) it plays
    instead of the iPad voice and then listens for his turn.
  - **🎬 My best sounds** (in the Sticker book): each word with his **first ever ⭐** and his **newest**, as his progress history.
  - Kept small: clips start once he starts talking, at a low bitrate; per word the first ⭐ is kept plus the newest 2;
    150 MB limit, removing the oldest non-first clips first. **📤 Save all to Files** and **🗑 Delete all clips** in Grown-ups.
- During a call, recording, the mirror and Build-it share the call's camera and mic instead of opening new ones.

## v18 · 2026-11-19 · Hands-free on by default
- **Hands-free** is now on by default: after each word is said, the app starts listening for him by itself.
  This applies to a fresh install (for example after re-adding the Home Screen icon). An iPad that has already been
  used keeps its current setting. Switch it on or off in Grown-ups → Game settings.

## v17 · 2026-11-18 · 🎙️ Voice report (optional, off by default)
- New Grown-ups → **🎙️ Voice report**. With **Save his tries for a voice report** on, each judged try is kept on the iPad
  with only the practice word, sound, level, the grown-up's ⭐/🔁, the day and a random session number.
  No name, no device details, and **My words are never saved**, since they can include family names.
  In Build-it it also records him quietly while he asks (never the iPad's own voice).
- **📤 Export for report** makes one .zip file (plain audio clips + a list) and opens the Share menu, to move it to a computer.
  **🗑 Delete saved tries** clears them. With the setting off, nothing changes: his recordings are still deleted after each word.
- The report itself is made on the grown-up's own computer, with tools kept outside this repo: speech-to-text runs offline there,
  and the report uses the grown-up's ⭐/🔁 marks for sound accuracy.

## v16 · 2026-11-17 · 🔧 Build-it, a game for asking
- New **🔧 Build** button on the home screen. He picks something to build: 🤖 robot, 🚀 rocket, 🚂 train, 🚒 fire truck,
  🚽 bathroom or 🎂 cake. Then he taps a part he wants (wheel, ladder, siren...) and gets it by **asking for it**.
  The grown-up taps ✅ **He asked!** and the iPad says it back ("Here's the wheel!"). The picture fills in with colour
  as the parts arrive, and the finished thing makes its sound (choo-choo, siren, flush, whoosh) before the 🎁 present.
- Grown-ups → **🔧 Build-it** sets how he asks: "wheel", "want wheel", "I want the wheel" or
  "Can I have the wheel, please?". It also sets whether the iPad says it for him straight away or waits 5 seconds first,
  to give him a chance to ask on his own.
- Grown-ups → Progress: a **Build-it** list showing what he built, the level, how many things he asked for, and how many he
  asked for on his own (before the iPad said it).
- ✋ Break and 👋 All done work in Build-it too.
- Fixed: two Game settings (his Break / All done buttons, Quiet mode) showed their text in narrow columns.

## v15 · 2026-11-17 · Calmer changes, Quiet mode, his own Break button
Based on a research review of home speech practice for young children.
- **Warning before each change in Practice time.** When the time is up he finishes a few more words first, and hears
  "Two more, then break time!" or "Last one, then your present!". The top bar shows the words left as dots (● ● 🎈).
  The listening warm-up ends with "Last one, then your turn!". Choose 1, 2 or 3 words, or Off, in Grown-ups → Practice time.
- **🤫 Quiet mode**: no sound effects, no bouncing or pulsing, and a softer voice. Turn it on from the pause screen when it gets
  too much, or in Grown-ups → Game settings.
- **Sound effects volume** (Soft / Medium / Full) and **sound on ⭐ Great** (every time / every 3rd / only at the present),
  so the flush doesn't have to play 30 times a session.
- **His own ✋ Break and 👋 All done buttons** in the corner of the card, in normal rounds and Practice time. Either one
  pauses, says "Okay, break time." or "Okay! All done.", and lets the grown-up choose Keep going or Finish now.
  Finishing still earns the present. Normal rounds can now be paused too. Hide the buttons in Grown-ups → Game settings.
- **Tries count**: during Practice time the grown-up row shows "Grown-up · 23 tries", or "23 of 50 tries" with a goal set in
  Grown-ups → Practice time (None / 50 / 75 / 100). Progress shows tries for each of the last 7 days, and 🎯 marks
  sessions that reached the goal.
- New setting: **play his voice back by itself** after each try (on by default). Turn it off for quicker tries.

## v14 · 2026-11-17 · ⏱️ Practice time (15-minute sessions)
- New **⏱️ Practice time** button on the home screen for a timed session, like his speech therapy sessions.
  Pick 1 or 2 sounds, then tap ▶️ Start. A 15-minute session runs in short blocks:
  👂 **Listen** 2 min (the iPad says lots of words with his sound; he just listens) →
  🗣️ **Your turn** 6 min (the normal game, non-stop until the time's up) →
  🎈 **Wiggle break** 1 min (opens a present for a sticker, then "Jump like a frog!", "Stomp like a dinosaur!") →
  🗣️ **Your turn** 6 min → 🎁 **Present** with how many tries and stars he got.
  With two sounds, he does one before the break and one after.
- A picture strip at the top shows where he is in the plan, with a bar for the current block and the minutes left.
- ⏸️ pauses the timer (Keep going / Finish now). It also pauses by itself if the app goes into the background.
  Finishing early still earns the present.
- Grown-ups → **⏱️ Practice time**: choose 5, 10 or 15 minutes (15 by default; 5 minutes has no break) and hide the button if you like.
- Grown-ups → Progress: a **Practice times** list with the day, sounds, minutes, tries and % great for each session.
- Buttons for the main action (Start, Let's go, Play again) are all the same gold colour.

## v13 · 2026-11-17 · 16 more sounds, in their own Sounds & levels menu
- **16 new sounds, all off by default**, so his home screen only shows what a grown-up picks:
  🍿 P, ⚽ B, 😋 M, ⏰ T, 🥁 D, 👃 N, 🌬️ H, 👻 W, 🙌 Y, 📷 K, 🎈 F, 🔔 NG, 🦘 J, 🐍 S, 🐝 Z, 🥶 R-blends.
  Each has a picture that makes the sound ("Popcorn pops: p-p-p!"), levels from the sound on its own up to silly sentences,
  a coaching card and a grown-up tip. 25 sounds in total.
- **Grown-ups → Sounds & levels is now its own screen** (tap "Choose sounds & levels"), so the main Grown-ups screen stays short.
  It lists sounds in four groups (early, middle, later, word patterns) with rough age guides. Tick a sound to put it on his
  home screen; its level menu and coaching tips appear once it's ticked.
- The main Grown-ups screen shows which sounds are on his home screen at a glance.
- S-blends now uses 🛑 ("sss-top!"), because plain S uses the 🐍 snake.

## v12 · 2026-11-17 · Tidier Grown-ups screen
- **Grown-up voice and My words lists:** on phones the word no longer gets squeezed to one letter per line.
  The Record / ▶️ / 🗑 buttons move to their own line underneath when there isn't room (iPad stays on one line).
- **Level menus** show just the level name, like "Start of words (10)", so they aren't cut off. The examples now sit underneath ("e.g. lion, leaf").
- **Checkboxes** stay full size next to long settings and line up with the first line of text.

## v11 · 2026-11-17 · Pictures that match the sound, captions back on phones
- The short explanation under each sound tile ("Race car: vvvroom!") shows on phones again, in a smaller size.
- 🐸 G is now 🦃 **"Turkey talk: gobble gobble!"**: a turkey really says the sound, where a frog doesn't.
  The "Just the sound" pictures, coaching card and tip match, and "gobble gobble" is a new practice item. Frog stays as a G word.
- 🐕 Endings caption now explains the picture: **"Doggy's tail: say the end!"**

## v10 · 2026-11-17 · SH is "the quiet sound"
- SH now uses 🤫 **"Quiet sound: shhh!"** instead of 🌊 ocean waves, matching the finger-to-lips cue speech therapists commonly use.
  This changes the home tile, the "Just the sound" pictures, the coaching card hint and the grown-up tip.

## v9 · 2026-11-17 · Real recorded sounds
- 21 real recordings (free, public domain, from BigSoundBank.com; see [CREDITS.md](CREDITS.md)), each cut short and evened out in volume. 240 KB in total, kept offline.
- **Stickers make their sound** when he finds one and when he taps it in his sticker book (a 🔊 marks which ones):
  dog, cat, cow, duck, sheep, horse, rooster, owl, bird, frog, train, cars and buses, bike, fire truck and ambulance,
  ship, plane, helicopter, rocket, toilet, camera, TV and radio.
- The toilet theme now uses a **real flush** on ⭐ Great and a real whoosh for the present. It waits for the flush to finish before saying the next word.
- New sticker: 🐑 sheep (Animals).
- Grown-ups → Game settings: new **Real recorded sounds** switch, and a **Test the sound effects** list to hear each one.
  "Gentle chimes" is now called **Sound effects** and turns everything off.

## v8 · 2026-11-17 · Toilets & gadgets theme
- New sticker theme **🚽 Toilets & gadgets** (Grown-ups → Him → Sticker collection): 28 stickers like 🚽 🧻 🪠 📷 📺 🔊 🤖 🛸.
- With this theme, ⭐ **Great!** plays a cartoon **flush** instead of the chime, and opening the present goes **whoosh**.
  The "Gentle chimes" setting turns these off too.
- New words: toilet (L), flush (SH), gadget (G), camera and speaker (R), speaker (S-blends).

## v7 · 2026-11-17 · Phone version
- Works on iPhones (and other phones) held upright or sideways. Every screen fits without scrolling,
  except Grown-ups, which scrolls as before.
- Held sideways, the game shows the picture on the left and the buttons on the right.
- On phones the small captions under the sound tiles are hidden to save space.
- iPad layout is unchanged.

## v6 · 2026-11-17 · Coaching when a sound is tricky
- After a miss (🔁 **Again**), the game now steps down instead of just repeating:
  - **1st miss:** the word is said more slowly, and a "how to make it" card appears under the picture.
  - **2nd miss:** the sound on its own first, then the word ("guh, guh, guh … goat").
  - **3rd miss:** moves on gently, as before.
- **How-to card** for each sound, with a picture and two short lines (e.g. 💋 "Lips push out like a kiss").
  Its 🔊 button plays the sound on its own again.
- **🪞 Mirror** button on the card shows the front camera so he can watch his mouth.
  Nothing is recorded, and the camera switches off on the next word.
- Grown-up voice: each sound now has a "the sound on its own" row, so you can record it yourself.
- Updates now always download fresh files, so an iPad can't end up with a mix of old and new files.

## v5 · 2026-11-17 · Hands-free mode
- New **Hands-free** setting (Grown-ups → Game settings, off by default). After the word is said, the app
  listens by itself, keeps his word once he starts talking, and stops when he goes quiet. If he says
  nothing for 6 seconds it stops quietly.
- "Hear me" now skips the silence before he spoke.

## v4 · 2026-11-17 · My words and grown-up voice
- **⭐ My words**: add words from his own life with an emoji or a photo. They're mixed into rounds, and
  each sound with My words also gets its own level. Saved on the iPad only.
- **🎙️ Grown-up voice**: record yourself saying the words so he hears a familiar voice instead of the
  iPad voice. Saved on the iPad only.

## v3 · 2026-11-17 · R and CH back on
- R and CH turned back on by default (still tricky for him). Home screen fits all 7 sounds.

## v2 · 2026-11-17 · More sounds and the big-voice meter
- Added 🐕 Endings (with word pairs like toe → toad), 🌊 SH, 🏎️ V, 🐸 G (with "K or G?" pairs) and L-blends.
- TH and S-blends available but off by default.
- **Big-voice meter** while recording, to encourage talking out loud.

## v1 · 2026-11-17 · First version
- Speech practice game for R, CH and L: listen, say it, hear yourself, grown-up taps ⭐ or 🔁.
- Stars, a sticker after every 5 words, sticker book, Grown-ups area (press and hold).
- Installs on the iPad Home Screen and works offline.
