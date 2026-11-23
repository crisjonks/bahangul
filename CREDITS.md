# Credits

- **Word list.** Starter vocabulary (first ~270 words) was written for this app. The rest is ranked by everyday frequency using
  [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (MIT; derived from OpenSubtitles) and lemmatized with
  [Kiwi](https://github.com/bab2min/Kiwi). English meanings come from [kengdic](https://github.com/garfieldnate/kengdic)
  by Joe Speigle (CC BY-SA 3.0 / LGPL 2.0). `src/course-words.json` is derived from kengdic and is shared under CC BY-SA 3.0.
  Meanings for the long tail are automatically selected and can be rough; the pipeline is in `scripts/build_words.py`.
- **Icons.** [Lucide](https://lucide.dev) (ISC).
- **Fonts.** [Allo](https://fonts.google.com) (SIL OFL 1.1), Noto Sans KR (SIL OFL 1.1).
- **Voice.** Audio clips are generated at build time with `edge-tts`.
