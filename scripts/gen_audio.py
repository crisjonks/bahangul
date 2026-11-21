"""Pre-generate natural Korean audio clips (neural TTS) so learners download nothing.
Needs: pip install edge-tts   (free, no API key; unofficial Microsoft Edge voices)."""
import asyncio, json, os, sys
import edge_tts

VOICE = os.environ.get("TTS_VOICE", "ko-KR-SunHiNeural")
OUT = "public/audio"

def fname(t):
    return "-".join(format(ord(c), "x") for c in t) + ".mp3"

async def one(sem, t):
    p = os.path.join(OUT, fname(t))
    if os.path.exists(p):
        return True
    async with sem:
        err = None
        for _ in range(3):
            try:
                await edge_tts.Communicate(t, VOICE).save(p)
                return True
            except Exception as e:
                err = e
                if os.path.exists(p):
                    os.remove(p)
                await asyncio.sleep(1)
        print("failed:", t, err)
        return False

async def main():
    os.makedirs(OUT, exist_ok=True)
    texts = json.load(open("scripts/manifest.json", encoding="utf-8"))
    sem = asyncio.Semaphore(6)
    res = await asyncio.gather(*(one(sem, t) for t in texts))
    print(sum(res), "/", len(res), "clips ready")
    if not any(res):
        sys.exit(1)

asyncio.run(main())
