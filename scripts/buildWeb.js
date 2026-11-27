// Builds www/, the small web bundle that goes inside the Android app.
// Usage: CANDO_SERVER=https://your-server node scripts/buildWeb.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const server = String(process.env.CANDO_SERVER || '').replace(/\/+$/, '');
if (server && !/^https?:\/\/[^\s'"<>]+$/.test(server)) throw new Error('CANDO_SERVER must be an http(s) address');

fs.rmSync(out, { recursive: true, force: true });
for (const item of ['css/ui.css', 'js/ui', 'js/sounds.js', 'js/jsqr.min.js', 'assets/ui', 'assets/applogo', 'assets/button sounds', 'assets/mascot narrations']) {
  fs.cpSync(path.join(root, 'public', item), path.join(out, item), { recursive: true });
}
fs.writeFileSync(path.join(out, 'js/config.js'), `window.CANDO_SERVER = ${JSON.stringify(server)};\n`);
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8')
  .replace('<script src="js/sounds.js"></script>', '<script src="js/config.js"></script>\n  <script src="js/sounds.js"></script>');
if (!html.includes('js/config.js')) throw new Error('public/index.html is not the new app');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`www/ built. Default server: ${server || '(none, the app will ask)'}`);
