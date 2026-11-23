import fs from 'fs';
import { LS, ALLI } from '../src/data.js';
const s = new Set(['안녕하세요']);
for (const l of LS) for (const a of [l.focus, l.pool, l.cards]) for (const x of a) s.add(x.say);
for (const x of ALLI) s.add(x.say);
for (const w of JSON.parse(fs.readFileSync('src/course-words.json', 'utf8')).words) s.add(w[0]);
fs.writeFileSync('scripts/manifest.json', JSON.stringify([...s]));
console.log(s.size, 'audio clips listed');
