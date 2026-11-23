// The Korean course: 1,000 lessons built from src/course-words.json (see scripts/build_words.py).
// Every unit = 9 lessons of 6 new words + 1 unit test.
import D from './course-words.json';
import { byCh } from './data.js';
export const KW = D.words.map(r => ({ ch: r[0], snd: r[1], mean: r[2], w: 1, say: r[0], syl: [...r[0].replace(/ /g, '')], tip: `${r[0]} (${r[1]}) means “${r[2]}”.`, pos: r[3] }));
KW.forEach(x => { if (!byCh[x.ch]) byCh[x.ch] = x; });
const PER = 6, LES = 9, UW = PER * LES, KT = ['wread', 'wlisten', 'wspell', 'wmix', 'wread', 'wlisten', 'wspell', 'wmix', 'wread'];
const NU = Math.floor(KW.length / UW);
export const KU = [], KS = [];
let acc = 0; const th = D.themes.map(([t, n]) => { const r = [t, acc, acc + n]; acc += n; return r; });
for (let u = 0; u < NU; u++) {
  const a = u * UW, mid = a + UW / 2, t = th.find(x => mid >= x[1] && mid < x[2]);
  KU.push(t ? t[0] : `Words ${a + 1}–${a + UW}`);
  for (let k = 0; k < LES; k++) {
    const s = a + k * PER, f = KW.slice(s, s + PER);
    KS.push({ id: 'K' + KS.length, u, c: 'k', first: u === 0 && k === 0, t: f.slice(0, 3).map(x => x.ch).join(', ') + '…', kind: KT[k], focus: f, pool: KW.slice(Math.max(0, s - 30), s + PER), cards: f });
  }
  KS.push({ id: 'K' + KS.length, u, c: 'k', t: `Unit ${u + 1} test`, kind: 'test', pass: 70, focus: KW.slice(a, a + UW), pool: KW.slice(Math.max(0, a - 30), a + UW) });
}
