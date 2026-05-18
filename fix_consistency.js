const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', 'dist', '.git'].includes(e.name)) walk(full, results);
    else if (e.isFile() && (e.name.endsWith('.jsx') || e.name.endsWith('.css')) && !e.name.startsWith('fix_')) results.push(full);
  });
  return results;
}

const COIN_FILES = ['VybeCoin.jsx', 'VybeCoinIcons.jsx']; // keep gold for coin icons

function fix(c, isCoinFile) {
  // ── PURPLE PRIMARY → CYAN (not secondary gradient uses) ──
  // Standalone hex purple used as UI color
  c = c.split("'#7c3aed'").join("'#00D4FF'");
  c = c.split('"#7c3aed"').join('"#00D4FF"');
  c = c.split("'#6d28d9'").join("'#00B8E0'");
  c = c.split('"#6d28d9"').join('"#00B8E0"');
  c = c.split("'#5b21b6'").join("'#0099BB'");
  c = c.split('"#5b21b6"').join('"#0099BB"');
  c = c.split("'#4f46e5'").join("'#00D4FF'");
  c = c.split('"#4f46e5"').join('"#00D4FF"');
  c = c.split("'#818cf8'").join("'#00B8E0'");
  c = c.split('"#818cf8"').join('"#00B8E0"');
  // rgba purple as primary UI color
  c = c.split('rgba(124,58,237,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(124,58,237,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(124, 58, 237, 0.12)').join('rgba(0,212,255,0.1)');
  // But do NOT replace rgba(124,58,237 in gradient stops (already handled by keeping gradient strings intact)

  // ── AMBER → CYAN (skip coin files) ──
  if (!isCoinFile) {
    c = c.split("'#f59e0b'").join("'#00D4FF'");
    c = c.split('"#f59e0b"').join('"#00D4FF"');
    c = c.split("'#fbbf24'").join("'#00B8E0'");
    c = c.split('"#fbbf24"').join('"#00B8E0"');
    c = c.split("'#FFB800'").join("'#00D4FF'");
    c = c.split('"#FFB800"').join('"#00D4FF"');
    c = c.split('rgba(245,158,11,0.07)').join('rgba(0,212,255,0.07)');
    c = c.split('rgba(245,158,11,0.08)').join('rgba(0,212,255,0.08)');
    c = c.split('rgba(245,158,11,0.1)').join('rgba(0,212,255,0.1)');
    c = c.split('rgba(245,158,11,0.12)').join('rgba(0,212,255,0.1)');
    c = c.split('rgba(245,158,11,0.14)').join('rgba(0,212,255,0.12)');
    c = c.split('rgba(245,158,11,0.15)').join('rgba(0,212,255,0.12)');
    c = c.split('rgba(245,158,11,0.2)').join('rgba(0,212,255,0.15)');
    c = c.split('rgba(245,158,11,0.22)').join('rgba(0,212,255,0.18)');
    c = c.split('rgba(245,158,11,0.25)').join('rgba(0,212,255,0.2)');
    c = c.split('rgba(245,158,11,0.3)').join('rgba(0,212,255,0.25)');
    c = c.split('rgba(245,158,11,0.4)').join('rgba(0,212,255,0.3)');
    c = c.split('rgba(245,158,11,0.5)').join('rgba(0,212,255,0.4)');
    c = c.split("color: '#f59e0b'").join("color: '#00D4FF'");
    c = c.split('color: "#f59e0b"').join('color: "#00D4FF"');
    c = c.split("color: '#fbbf24'").join("color: '#00B8E0'");
    // Amber gradients → cyan
    c = c.split('linear-gradient(135deg, #f59e0b').join('linear-gradient(135deg, #00D4FF');
    c = c.split('linear-gradient(135deg, #fbbf24').join('linear-gradient(135deg, #00B8E0');
    c = c.split('from-yellow-').join('from-cyan-');
    c = c.split('to-amber-').join('to-cyan-');
    c = c.split('text-yellow-').join('text-cyan-');
    c = c.split('text-amber-').join('text-cyan-');
    c = c.split('bg-yellow-').join('bg-cyan-');
    c = c.split('bg-amber-').join('bg-cyan-');
  }

  // ── TAILWIND PURPLE/INDIGO/BLUE CLASSES → CYAN ──
  // text-purple-XXX → text-cyan-400
  c = c.replace(/text-purple-\d+/g, 'text-cyan-400');
  c = c.replace(/bg-purple-\d+/g, 'bg-cyan-500');
  c = c.replace(/border-purple-\d+/g, 'border-cyan-400');
  c = c.replace(/ring-purple-\d+/g, 'ring-cyan-400');
  c = c.replace(/from-purple-\d+/g, 'from-cyan-400');
  c = c.replace(/to-purple-\d+/g, 'to-cyan-400');
  c = c.replace(/hover:text-purple-\d+/g, 'hover:text-cyan-400');
  c = c.replace(/hover:bg-purple-\d+/g, 'hover:bg-cyan-500');
  // text-indigo-XXX → text-cyan-400
  c = c.replace(/text-indigo-\d+/g, 'text-cyan-400');
  c = c.replace(/bg-indigo-\d+/g, 'bg-cyan-500');
  // text-blue-XXX / bg-blue-XXX → cyan (already done mostly, mop up remainders)
  c = c.replace(/text-blue-\d+/g, 'text-cyan-400');
  c = c.replace(/bg-blue-\d+/g, 'bg-cyan-500');
  c = c.replace(/border-blue-\d+/g, 'border-cyan-400');
  // Keep cyan-XXX as-is (already correct)

  // ── TEXT COLOR NORMALISATION ──
  // Various muted/secondary text shades that should be consistent
  // Primary text: #ffffff
  // Secondary text: rgba(255,255,255,0.6)
  // Muted text: rgba(255,255,255,0.35)
  // Accent text: #00D4FF

  // Remaining old blue in text
  c = c.split("color: '#1B62F5'").join("color: '#00D4FF'");
  c = c.split("color: '#2F6BFF'").join("color: '#00D4FF'");
  c = c.split("color: '#3B82F6'").join("color: '#00D4FF'");
  c = c.split("color: '#60A5FA'").join("color: '#00B8E0'");
  c = c.split("color: '#4D8DFF'").join("color: '#00D4FF'");
  c = c.split("color: '#4B88F7'").join("color: '#00B8E0'");

  // ── BG NORMALISATION ──
  // Any remaining old dark backgrounds
  c = c.split("'#050816'").join("'#0a0a0f'");
  c = c.split('"#050816"').join('"#0a0a0f"');
  c = c.split("'#07070e'").join("'#0a0a0f'");
  c = c.split('"#07070e"').join('"#0a0a0f"');
  c = c.split("'#0d0d1b'").join("'#111120'");
  c = c.split('"#0d0d1b"').join('"#111120"');
  c = c.split("background: '#050816'").join("background: '#0a0a0f'");
  c = c.split('background: "#050816"').join('background: "#0a0a0f"');
  c = c.split("background: '#07070e'").join("background: '#0a0a0f'");
  c = c.split('background: "#07070e"').join('background: "#0a0a0f"');

  // ── INDEX.CSS: remove remaining text-purple- class ──
  // (handled by regex above for .jsx files; for .css file we do literal)
  c = c.split('.text-purple-gradient {').join('.text-cyan-purple-gradient {'); // rename not remove — keep the actual gradient

  return c;
}

const files = walk('frontend/src');
let changed = 0;
for (const file of files) {
  const isCoin = COIN_FILES.some(cf => file.endsWith(cf));
  const original = fs.readFileSync(file, 'utf8');
  const updated = fix(original, isCoin);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Updated:', path.basename(file));
    changed++;
  }
}
console.log('\n' + changed, 'files updated');

// ── VERIFY ────────────────────────────────────────────────────────────────────
const STALE = ['#7c3aed','rgba(245,158,11','text-purple-','bg-purple-','text-blue-','bg-blue-','text-indigo-'];
let issues = 0;
for (const file of files) {
  if (COIN_FILES.some(cf => file.endsWith(cf))) continue;
  const c = fs.readFileSync(file,'utf8');
  STALE.forEach(s => {
    let n=0,i=0;
    while((i=c.indexOf(s,i))!==-1){n++;i++;}
    if(n){ console.log('STILL PRESENT in', path.basename(file)+':', s, '('+n+')'); issues++; }
  });
}
if (!issues) console.log('All clean!');
