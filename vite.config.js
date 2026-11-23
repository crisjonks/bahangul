import fs from 'fs';
import path from 'path';
// After the build, write dist/sw.js with the list of files to cache for offline use (audio is cached on demand).
const sw = () => ({
  name: 'bh-sw', apply: 'build',
  closeBundle() {
    const root = 'dist', out = [];
    if (!fs.existsSync(root)) return;
    const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), rel = path.relative(root, p).split(path.sep).join('/'); if (fs.statSync(p).isDirectory()) { if (rel !== 'audio') walk(p); } else if (rel !== 'sw.js' && !rel.endsWith('.map') && !f.startsWith('.')) out.push(rel); } };
    walk(root);
    fs.writeFileSync(path.join(root, 'sw.js'), fs.readFileSync('src/sw-template.js', 'utf8').replace('__PRECACHE__', JSON.stringify(out)).replace('__VERSION__', Date.now().toString(36)));
  },
});
export default { base: './', plugins: [sw()] };
