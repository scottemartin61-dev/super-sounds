# Super Sounds

A gentle speech-practice game for a 5-year-old.
It's a web app that installs on an iPad's Home Screen and then works like a normal app, including offline.

## Sounds
On by default:
- 🐕 **Endings**: saying the last sound of words ("watch" not "wa"). Includes word pairs like toe → toad.
- 🎵 **L**, including L-blends (blue, clock, flag)
- 🤫 **SH**
- 🏎️ **V**
- 🦃 **G**, including "K or G?" pairs (coat → goat)
- 🐯 **R**
- 🚂 **CH**

Off by default (turn on in Grown-ups → **Sounds & levels**), grouped by the age most children learn them:
- Early: 🍿 **P**, ⚽ **B**, 😋 **M**, ⏰ **T**, 🥁 **D**, 👃 **N**, 🌬️ **H**, 👻 **W**, 🙌 **Y**
- Middle: 📷 **K**, 🎈 **F**, 🔔 **NG**
- Later: 🦘 **J**, 🐍 **S**, 🐝 **Z**, 👅 **TH**
- Word patterns: 🛑 **S-blends**, 🥶 **R-blends**

Only the sounds a grown-up ticks show on his home screen. New sounds live in [words-more.js](words-more.js).

## How a round works
1. He taps a sound. The iPad says each word slowly. Tap 🔊 to hear it again.
2. He taps 🎤 **My turn** and says the word. A **big-voice meter** fills up as he talks, to encourage speaking out loud rather than whispering. 👂 **Hear me** plays his voice back.
   **Hands-free** is on by default (switch it off in Grown-ups → Game settings): he doesn't need to tap: after the word is said, the app listens by itself (the button shows "Listening…"), keeps his word once he starts talking, and stops when he goes quiet. If he says nothing for 6 seconds it stops quietly. Background noise or a grown-up talking can also set it off.
3. A grown-up taps ⭐ **Great!** or 🔁 **Again**. After a miss the game coaches him:
   - 1st miss: the word again, more slowly, with a "how to make it" card (picture and tip). The card has a 🪞 **Mirror** button that shows the front camera so he can watch his mouth. Nothing is recorded.
   - 2nd miss: the sound on its own first, then the word ("guh, guh, guh … goat").
   - 3rd miss: the game moves on by itself.
4. After 5 words he opens a 🎁 and gets a new sticker for his book, every time.

### ⏱️ Practice time
A timed session in short blocks, like a speech therapy session. Tap ⏱️ on the home screen, pick 1 or 2 sounds, and tap ▶️ Start.
A 15-minute session goes 👂 listen (2 min) → 🗣️ his turn (6 min) → 🎈 wiggle break with a sticker (1 min) → 🗣️ his turn (6 min) → 🎁 present.
With two sounds he does one before the break and one after. A strip at the top shows where he is and the minutes left.
Tap ⏸️ to pause or finish early (he still gets the present). Choose 5, 10 or 15 minutes in Grown-ups → Practice time.
When the time for a block is up, he gets a warning first: a couple more words, "Two more, then break time!", with dots (● ● 🎈) in the top bar.
During Practice time the grown-up row counts his tries, with an optional goal. Each session is listed in Grown-ups → Progress.

### 🔧 Build-it
A game for asking. Tap 🔧 **Build** on the home screen. He picks something to build (robot, rocket, train, fire truck, bathroom or cake),
taps a part he wants, and gets it by asking for it: the grown-up taps ✅ **He asked!**. The iPad says it back ("Here's the wheel!").
In Grown-ups → Build-it, choose how he asks ("wheel" → "want wheel" → "I want the wheel" → "Can I have the wheel, please?")
and whether the iPad says it for him straight away or waits 5 seconds first. Progress shows how many things he asked for on his own.

### Break, All done and Quiet mode
The card has two picture buttons for him: ✋ **Break** and 👋 **All done**. Either one pauses the game, says "Okay!", and lets
the grown-up choose Keep going or Finish now (finishing still earns the present). Honouring them teaches him that asking works.
🤫 **Quiet mode** (on the pause screen, or in Grown-ups) turns off sound effects and animations and softens the voice.
Grown-ups → Game settings also sets the effects volume and whether ⭐ Great plays a sound every time, every 3rd time or only at the present.

The **Grown-ups** button on the home screen only opens if you press and hold it for 2 seconds. In there you can set:
- his name and sticker theme
- which sounds show and the level for each one (e.g. just the sound → start / middle / end of words → sentences)
- words per round, talking speed, microphone, chimes
- how long Practice time lasts (5, 10 or 15 minutes), the warning before each change, and a tries goal
- Quiet mode, effects volume, his Break / All done buttons, and whether his voice plays back after each try
- the big-voice meter, and how loud counts as a big voice (Easy / Medium / Hard)

It also has coaching tips for each sound and his progress (tries, % great, tricky words, days practised, Practice times).

### My words
Add words from his own life (family names, pets, toys, foods) with an emoji or a photo.
Each word belongs to one sound. Those words are mixed into his rounds (about 1 in 3), and that sound also gets a **⭐ My words** level.
They're saved on the iPad only, never in this repo, so personal names stay private.
Add them inside the Home Screen app: Safari and the Home Screen app keep separate lists.

### Grown-up voice
Pick a sound and level, then tap 🎙️ **Record** next to each word and say it (tap ⏹ to stop).
After that, he hears your voice for that word instead of the iPad voice. Silence before and after is trimmed, and the volume is evened out.
Words you haven't recorded still use the iPad voice. Recordings are saved on the iPad only.
Deleting the app from the Home Screen erases them, along with My words photos.

### Sound effects
Stickers like 🐮 🚂 📷 make a real recorded sound when he finds them, and again when he taps them in the sticker book.
The toilet theme flushes on ⭐ Great. You can switch these off in Grown-ups → Game settings, and test each one there first.
The sounds are free public-domain recordings from BigSoundBank.com ([CREDITS.md](CREDITS.md)).

### 📹 Video call
His iPad and a grown-up somewhere else (a parent, grandparent or his therapist) can see and hear each other. On his iPad, Grown-ups →
📹 Video call → **Start video call**, then **Send the link** (or let them scan the QR code with their phone's camera).
The grown-up opens the link on their phone, tablet or computer and taps Join.
On his iPad the grown-up appears in a small window in the corner; tap it to make it bigger (with his own picture, and an End button).
The grown-up's screen shows him on video, the word he's on with the target sound highlighted and a coaching tip, and the
⭐ Great / 🔁 Again / Skip buttons. They can also start a round, Practice time or Build-it, pause, and turn on Quiet mode.
They get an alert when he taps ✋ Break or 👋 All done.
They also have **🎙️ Mute me**, and **📝 Notes**: notes typed during the call are tagged with the time and the word he's on,
with a count of ⭐ / 🔁 per word, and **📤 Share notes** sends them as text. Notes stay on the grown-up's device. Live only, never recorded. Both devices need the internet; some networks
(school or office Wi-Fi, some mobile data) can block calls. Speech therapists usually have to use an approved telehealth service,
so check with his before using it for sessions.

### 🎬 Star clips (optional, off by default)
With Grown-ups → 🎬 Star clips on, the camera records him while he says each word, and the tries you mark ⭐ Great are kept on the iPad.
- **Watch yourself:** the next time that word comes up he can watch his own ⭐ clip first (a 🎬 Watch me button, or played instead of
  the iPad voice). Seeing yourself get it right is a strong prompt (video self-modelling).
- **Progress history:** 📖 Sticker book → 🎬 **My best sounds** shows each word with his **first ever ⭐** and his **newest**, so you
  can see how far he's come.
- **Kept small:** clips start when he starts talking and are recorded small (about 100–250 KB). For each word the first ⭐ is kept
  for good, plus the newest 2. If they pass 150 MB, the oldest non-first clips are removed.
- **📤 Save all to Files** makes one .zip of the videos; **🗑 Delete all clips** clears them. Never online and never in the Voice report.

### 🎙️ Voice report (optional, off by default)
Grown-ups → 🎙️ Voice report → **Save his tries for a voice report** keeps his judged tries on the iPad with only the word,
sound, level, your ⭐/🔁 and the day. No name, and My words are never saved. **📤 Export for report** makes one .zip to copy
to a computer, where a separate offline tool (not in this repo) transcribes the clips and writes a report for his parents.
**🗑 Delete saved tries** clears them from the iPad. Ask his parents before turning it on: it's his voice.

## Putting it on his iPad
The app has to be online at an `https://` address. The microphone only works over https.

1. On his iPad, open **Safari** and go to the app's address.
2. Tap the **Share** button (square with an arrow) → **Add to Home Screen** → **Add**.
3. Open **Super Sounds** from the Home Screen. The first time he taps 🎤, tap **Allow** for the microphone.

It works the same way on an **iPhone**: open the address in Safari → Share → Add to Home Screen. It works upright or sideways.
Each device keeps its own stars, stickers, My words and recordings.

Tips:
- Turn on **Guided Access** to keep him in the app. Go to Settings → Accessibility → Guided Access, then triple-click the top button while the app is open.
- If he can't hear the voice, check that the iPad's side **mute switch** is off and the volume is up.
- Progress and stickers are saved on that iPad only. Deleting the Home Screen icon erases them.
- Some pictures use newer emoji. Keep the iPad updated (iPadOS 17 or later) so they all show.

## Changing words
Edit [words.js](words.js). Each word is `{ w: "word", p: "emoji" }`. Add `say: "..."` if the voice mispronounces something.
After changing any file, bump `VERSION` in [sw.js](sw.js) (e.g. `super-sounds-v2`) and add an entry to [CHANGELOG.md](CHANGELOG.md). The iPad picks up the update the next time the app is opened, or the time after that.

## Running it on this PC
```bash
python -m http.server 8080
```
Then open http://localhost:8080.

## Privacy
There are no accounts, ads or tracking. His recordings are kept in memory only and deleted when he moves to the next word,
unless a grown-up turns on 🎙️ Voice report or 🎬 Star clips. Then they stay on the iPad until they're exported or deleted.
📹 Video calls are live only: nothing is recorded. Video and sound go directly between the two devices, encrypted, and a free
public service (PeerJS) only introduces them.
Grown-up recordings, My words and their photos are saved on the iPad until you delete them.
Everything else (settings, stars, stickers, progress) stays in the iPad's local storage too.
