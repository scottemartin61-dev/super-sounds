# Super Sounds

A gentle speech-practice game for a 5-year-old.
It's a web app that installs on an iPad's Home Screen and then works like a normal app, including offline.

## Sounds
On by default:
- 🐕 **Endings**: saying the last sound of words ("watch" not "wa"). Includes word pairs like toe → toad.
- 🎵 **L**, including L-blends (blue, clock, flag)
- 🌊 **SH**
- 🏎️ **V**
- 🐸 **G**, including "K or G?" pairs (coat → goat)
- 🐯 **R**
- 🚂 **CH**

Off by default (turn on in Grown-ups): 👅 **TH**, 🐍 **S-blends**.

## How a round works
1. He taps a sound. The iPad says each word slowly. Tap 🔊 to hear it again.
2. He taps 🎤 **My turn** and says the word. A **big-voice meter** fills up as he talks, to encourage speaking out loud rather than whispering. 👂 **Hear me** plays his voice back.
   With **Hands-free** on (Grown-ups → Game settings), he doesn't need to tap: after the word is said, the app listens by itself (the button shows "Listening…"), keeps his word once he starts talking, and stops when he goes quiet. If he says nothing for 6 seconds it stops quietly. Background noise or a grown-up talking can also set it off.
3. A grown-up taps ⭐ **Great!** or 🔁 **Again**. After a miss the game coaches him:
   - 1st miss: the word again, more slowly, with a "how to make it" card (picture and tip). The card has a 🪞 **Mirror** button that shows the front camera so he can watch his mouth. Nothing is recorded.
   - 2nd miss: the sound on its own first, then the word ("guh, guh, guh … goat").
   - 3rd miss: the game moves on by itself.
4. After 5 words he opens a 🎁 and gets a new sticker for his book, every time.

The **Grown-ups** button on the home screen only opens if you press and hold it for 2 seconds. In there you can set:
- his name and sticker theme
- which sounds show and the level for each one (e.g. just the sound → start / middle / end of words → sentences)
- words per round, talking speed, microphone, chimes
- the big-voice meter, and how loud counts as a big voice (Easy / Medium / Hard)

It also has coaching tips for each sound and his progress (tries, % great, tricky words, days practised).

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
There are no accounts, ads or tracking. His recordings are kept in memory only and deleted when he moves to the next word.
Grown-up recordings, My words and their photos are saved on the iPad until you delete them.
Everything else (settings, stars, stickers, progress) stays in the iPad's local storage too.
