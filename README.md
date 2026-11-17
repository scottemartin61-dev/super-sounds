# Super Sounds

A gentle speech-practice game for a 5-year-old working on **R**, **CH** and **L**.
It's a web app that installs on an iPad's Home Screen and then works like a normal app, including offline.

## How a round works
1. He taps a sound (🐯 R, 🚂 CH, 🎵 L). The iPad says each word slowly. Tap 🔊 to hear it again.
2. He taps 🎤 **My turn**, says the word, and 👂 **Hear me** plays his voice back.
3. A grown-up taps ⭐ **Great!** or 🔁 **Again**. After 3 tries the game moves on by itself.
4. After 5 words he opens a 🎁 and gets a new sticker for his book, every time.

The **Grown-ups** button on the home screen only opens if you press and hold it for 2 seconds. In there you can set:
- his name and sticker theme
- which sounds show and the level for each one (just the sound → start / middle / end of words → sentences)
- words per round, talking speed, microphone and chimes

It also has coaching tips for each sound and his progress (tries, % great, tricky words, days practised).

## Putting it on his iPad
The app has to be online at an `https://` address. The microphone only works over https.

1. On his iPad, open **Safari** and go to the app's address.
2. Tap the **Share** button (square with an arrow) → **Add to Home Screen** → **Add**.
3. Open **Super Sounds** from the Home Screen. The first time he taps 🎤, tap **Allow** for the microphone.

Tips:
- Turn on **Guided Access** to keep him in the app. Go to Settings → Accessibility → Guided Access, then triple-click the top button while the app is open.
- If he can't hear the voice, check that the iPad's side **mute switch** is off and the volume is up.
- Progress and stickers are saved on that iPad only. Deleting the Home Screen icon erases them.

## Changing words
Edit [words.js](words.js). Each word is `{ w: "word", p: "emoji" }`. Add `say: "..."` if the voice mispronounces something.
After changing any file, bump `VERSION` in [sw.js](sw.js) (e.g. `super-sounds-v2`). The iPad picks up the update the next time the app is opened, or the time after that.

## Running it on this PC
```bash
python -m http.server 8080
```
Then open http://localhost:8080.

## Privacy
There are no accounts, ads or tracking. Recordings are kept in memory only and deleted when he moves to the next word.
Everything else (settings, stars, stickers, progress) stays in the iPad's local storage.
