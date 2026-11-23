"""Builds src/course-words.json: ~5,400 Korean words ranked by everyday frequency, with English meanings and romanization.
Sources (see CREDITS.md): hermitdave/FrequencyWords ko_50k (MIT) for ranking; garfieldnate/kengdic (CC BY-SA 3.0 / LGPL 2.0) for meanings.
Needs: pip install kiwipiepy korean-romanizer"""
import csv, json, re, sys, urllib.request, collections
from kiwipiepy import Kiwi
from korean_romanizer.romanizer import Romanizer
FREQ = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt'
KENG = 'https://raw.githubusercontent.com/garfieldnate/kengdic/HEAD/kengdic.tsv'
TARGET = int(sys.argv[1]) if len(sys.argv) > 1 else 5400
get = lambda u: urllib.request.urlopen(u, timeout=120).read().decode('utf-8')
BAD_KO = ['씨발','시발','좆','존나','졸라','새끼','병신','지랄','염병','썅','창녀','걸레','보지','자지','섹스','강간','성교','음경','음란','젠장','엿','꺼져','닥쳐']
BAD_EN = re.compile(r'vulgar|fuck|shit|bitch|whore|pussy|penis|vagina|nigg|\bsex|rape|cunt|\bdick|\bcock|slut|bastard|genital|erotic|porn|prostitut|masturbat|testicle|anus|curse|damn', re.I)
# --- meanings from kengdic ---
gl = collections.defaultdict(list)
for row in csv.DictReader(get(KENG).splitlines(), delimiter='\t'):
    g = (row.get('gloss') or '').strip()
    if g and row.get('surface'): gl[row['surface']].append(g)
RARE = float(sys.argv[2]) if len(sys.argv) > 2 else 2.6
BAD_EN = re.compile(BAD_EN.pattern + r'|cocaine|venereal|heroin|corpse|negro|retard|cripple|gypsy|midget', re.I)
def clean(g):
    g = re.sub(r'\s+', ' ', re.sub(r'\s*\(.*?\)', '', g)).strip(' ;,.')
    g = re.sub(r'^(a|an|the) ', '', g.split(' or ')[0].strip(), flags=re.I)
    from wordfreq import zipf_frequency as zf
    if any(zf(x, 'en') < RARE for x in re.findall(r"[a-z]+", g.lower())): return ''
    g = g.split(';')[0].strip()
    if len(g) > 34 and ',' in g: g = g.split(',')[0].strip()
    return g if g and len(g) <= 34 and re.fullmatch(r"[A-Za-z0-9 ,'\-/&.!?]+", g) and not BAD_EN.search(g) else ''
from wordfreq import zipf_frequency
STOP = {'to', 'be', 'a', 'an', 'the', 'of', 'in', 'on', 'or', 'and', 'one', 'who', 'that', 'is'}
def score(g):
    ws = [x for x in re.findall(r"[a-z]+", g.lower()) if x not in STOP]
    if not ws or re.search(r'\d', g): return -9
    return sum(zipf_frequency(x, 'en') for x in ws) / len(ws) - 0.04 * len(g) - 0.3 * g.count(',')
def readkv(f):
    d = {}
    for l in open(f, encoding='utf-8'):
        l = l.rstrip('\n')
        if l and not l.startswith('#') and '=' in l: k, v = l.split('=', 1); d[k] = v
    return d
OVERRIDES = readkv('scripts/gloss_overrides.txt')
CURATED, THEMES = [], []
for l in open('scripts/curated.txt', encoding='utf-8'):
    l = l.rstrip('\n')
    if l.startswith('#T '): THEMES.append([l[3:], 0])
    elif '=' in l:
        k, v = l.split('=', 1)
        if k not in [c[0] for c in CURATED]: CURATED.append([k, v]); THEMES[-1][1] += 1
def meaning(w):
    if w in OVERRIDES: return OVERRIDES[w]
    cands = []
    for g in gl.get(w, []):
        c = clean(g)
        if c and c.lower() not in [x.lower() for x in cands]: cands.append(c)
    if not cands: return ''
    cands.sort(key=score, reverse=True)
    if score(cands[0]) < 1.0: return ''
    m = cands[0].lower() if not cands[0][:1].isupper() or cands[0][1:2].islower() else cands[0]
    m = m[:1].lower() + m[1:] if m[:1].isupper() and not m[1:2].isupper() else m
    if len(cands) > 1 and score(cands[1]) > 2.2 and len(cands[1]) <= 18 and len(m) + len(cands[1]) <= 28: m += ' / ' + cands[1][:1].lower() + cands[1][1:]
    return m
# --- lemmatize the frequency list ---
kiwi = Kiwi(); cnt = collections.Counter()
OK = {'NNG', 'NR', 'NP', 'VV', 'VA', 'MAG', 'MM', 'IC'}
for line in get(FREQ).splitlines():
    try: w, c = line.split(); c = int(c)
    except ValueError: continue
    toks = kiwi.tokenize(w)
    if not toks or toks[0].tag not in OK: continue
    t = toks[0]
    if t.tag in ('VV', 'VA'):
        if len(toks) > 1 and toks[1].tag == 'XSV': continue
        lem = t.form + '다'
    else:
        if len(toks) > 1 and toks[1].tag in ('XSV', 'XSA'): lem = t.form
        elif len(toks) > 1 and toks[1].tag.startswith('N') and toks[1].tag != 'NNB': continue
        else: lem = t.form
    if not re.fullmatch(r'[가-힣]+', lem) or any(b in lem for b in BAD_KO): continue
    if len(lem) == 1 and lem not in OVERRIDES: continue
    cnt[(lem, t.tag)] += c
# --- romanization (with the ㄷ/ㅌ + 이 palatalization rule the library misses) ---
def pal(s):
    o = list(s)
    for i in range(len(o) - 1):
        a, b = ord(o[i]) - 0xAC00, ord(o[i + 1]) - 0xAC00
        if 0 <= a < 11172 and 0 <= b < 11172 and a % 28 in (7, 25) and b // 588 == 11 and (b % 588) // 28 == 20 and b % 28 == 0:
            ini = 12 if a % 28 == 7 else 14
            o[i] = chr(0xAC00 + a - a % 28); o[i + 1] = chr(0xAC00 + ini * 588 + 20 * 28)
    return ''.join(o)
rom = lambda w: Romanizer(pal(w)).romanize().replace("'", '').replace('lr', 'll').replace('nr', 'll')
words, seen = [], set()
for k, v in CURATED:
    seen.add(k); words.append([k, rom(k), v, ''])
POS = {'NNG': 'noun', 'NR': 'number', 'NP': 'pronoun', 'VV': 'verb', 'VA': 'adjective', 'MAG': 'adverb', 'MM': 'determiner', 'IC': 'interjection'}
for (lem, tag), c in cnt.most_common():
    if lem in seen: continue
    m = meaning(lem)
    if not m or (lem not in OVERRIDES and score(m.split(' / ')[0]) < 2.0 or re.search(r'\b(sb|sth|etc)\b', m)): continue
    if tag == 'VV' and not m.startswith('to '): m = 'to ' + m
    if tag == 'VA' and not m.startswith(('to ', 'be ')): m = 'to be ' + m
    seen.add(lem); words.append([lem, rom(lem), m, POS[tag]])
    if len(words) >= TARGET: break
json.dump({'themes': THEMES, 'words': words}, open('src/course-words.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(words), 'words written;', len(cnt), 'candidate lemmas')
for i in list(range(0, 25)) + [500, 1500, 3000, 4500, len(words) - 1]: print(i + 1, words[i])
