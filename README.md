# BaHangul (바한글)

Duolingo-style Korean learning app: 103 Hangul lessons that teach the **sound** of each letter, with listening, writing and word reading. Vanilla JS + Vite, Lucide icons, optional Firebase accounts, sync and leaderboards.

## Run it

```bash
npm install
npm run dev
```

## Voice (nothing for learners to download)

Lessons play pre-generated Korean audio clips (`public/audio/*.mp3`) made with a natural neural voice. If a clip is missing, the app falls back to the device's own voice.

```bash
pip install edge-tts
npm run audio      # lists every clip the lessons need, then generates them (~290 files)
```

The GitHub Action does this automatically on every deploy, so you don't have to commit audio. `edge-tts` is an unofficial, free client for Microsoft's voices; swap the voice with `TTS_VOICE=ko-KR-InJoonNeural`, or replace the script with Google Cloud TTS if you want an official API.

## Publish to GitHub Pages

```bash
gh repo create bahangul --public --source=. --push
# or: git remote add origin https://github.com/<you>/bahangul.git && git push -u origin main
```

Then on GitHub: **Settings > Pages > Source: GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

## Firebase (accounts, sync, leaderboards)

1. Create a project at console.firebase.google.com (Spark plan is free).
2. **Authentication > Sign-in method**: enable Email/Password and Google. Under **Settings > Authorized domains** add `<you>.github.io`.
3. **Firestore Database**: create it, then paste `firestore.rules` into the Rules tab and publish.
4. **Project settings > Your apps > Web**: copy the config values.
5. Paste the config values into `src/firebase-config.js` (they are safe to commit), then commit and push.

Without keys the app runs in local-only mode and says so on the Account and Ranks screens.

How sync works: progress saves to `users/{uid}` (private to that user). On sign-in the copy with more XP wins. Leaderboard entries (`leaderboard/{uid}`: name, avatar, XP) are public to signed-in users and can be turned off in Profile > Settings.

**Known limit:** XP is calculated in the browser, so a determined user could edit it. Checking rewards server-side needs Cloud Functions (Blaze plan).

## Not built yet

Stroke-order animation, microphone speaking practice, vocabulary flashcards with spaced repetition, Korean levels 1-6, weekly league promotion, friends.

## Logo

Drop your logo at `public/icon.png`. Until it exists the app shows `public/bori.svg`. Clicking the logo text switches between BaHangul and 바한글.

## Public profiles

Profiles live in `profiles/{uid}` and usernames in `usernames/{name}`. After pulling this version, paste the new `firestore.rules` into the Firebase console (Firestore > Rules > Publish). Profile links look like `#u/username`.

## Install as an app (PWA)

The site is an installable PWA: open it in Chrome, Edge or Safari and use Install / Add to Home Screen. It works offline once loaded; audio clips are cached the first time they play.

- **Reminders:** Settings > Daily reminder. They fire while the app is open, and on installed Android Chrome apps through Periodic Background Sync (timing is up to the browser). Exact-time reminders when the app is fully closed need a push server.
- **Streak widget:** a Windows 11 widget (Microsoft Edge) is declared in the manifest, and the installed app icon shows your streak as a badge where the Badging API exists. Home-screen widgets on Android and iOS need a native app.

## Course content

`scripts/build_words.py` rebuilds `src/course-words.json` (needs `pip install kiwipiepy korean-romanizer wordfreq`). Edit `scripts/curated.txt` (starter vocabulary) and `scripts/gloss_overrides.txt` (corrected meanings) and rerun it. See CREDITS.md.
