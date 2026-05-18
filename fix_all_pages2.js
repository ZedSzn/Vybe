const fs = require('fs');
const path = require('path');

// Replace ANY rgba(R,G,B, opacity) pattern for stale color bases
function replaceRgba(c, oldBase, newBase) {
  const re = new RegExp('rgba\\(' + oldBase.replace(/,/g, ',\\s*') + ',\\s*([\\d.]+)\\)', 'g');
  return c.replace(re, (_, alpha) => `rgba(${newBase},${alpha})`);
}

// Replace specific hex but NOT inside a gradient that already has #00D4FF paired with it
function replaceHex(c, old, replacement) {
  return c.split(old).join(replacement);
}

const FILES = [
  'frontend/src/pages/TermsPage.jsx',
  'frontend/src/pages/PrivacyPage.jsx',
  'frontend/src/pages/GuidelinesPage.jsx',
  'frontend/src/pages/EarnPage.jsx',
  'frontend/src/pages/ChatPage.jsx',
  'frontend/src/pages/AuthPage.jsx',
  'frontend/src/pages/ProfilePage.jsx',
  'frontend/src/components/Button.jsx',
  'frontend/src/components/Input.jsx',
  'frontend/src/components/Navbar.jsx',
  'frontend/src/components/VybeBadge.jsx',
];

for (const file of FILES) {
  let c = fs.readFileSync(file, 'utf8');
  const before = c;

  // ── Purple rgba ALL opacities ──
  c = replaceRgba(c, '124,58,237', '0,212,255');
  c = replaceRgba(c, '109,40,217', '0,212,255');
  c = replaceRgba(c, '167,139,250', '0,184,224');  // lighter purple → lighter cyan
  c = replaceRgba(c, '139,92,246', '0,212,255');

  // ── Amber rgba ALL opacities ──
  c = replaceRgba(c, '245,158,11', '0,212,255');
  c = replaceRgba(c, '251,191,36', '0,184,224');
  c = replaceRgba(c, '217,119,6', '0,212,255');

  // ── Green rgba ALL opacities ──
  c = replaceRgba(c, '34,197,94', '0,212,255');
  c = replaceRgba(c, '16,185,129', '0,212,255');
  c = replaceRgba(c, '5,150,105', '0,212,255');
  c = replaceRgba(c, '52,211,153', '51,221,255');

  // ── hex purple/green/amber ──
  c = replaceHex(c, '#7c3aed', '#00D4FF');
  c = replaceHex(c, '#7C3AED', '#00D4FF');
  c = replaceHex(c, '#a855f7', '#7C3AED');  // lighter purple stays as gradient secondary
  c = replaceHex(c, '#9333ea', '#00D4FF');
  c = replaceHex(c, '#10b981', '#00D4FF');
  c = replaceHex(c, '#059669', '#00B8E0');
  c = replaceHex(c, '#22c55e', '#00D4FF');
  c = replaceHex(c, '#f59e0b', '#00D4FF');
  c = replaceHex(c, '#fbbf24', '#00B8E0');

  // ── text-purple-gradient (CSS class) — keep, just ensure consistent ──
  // Don't change className="text-purple-gradient" — the CSS renders it cyan now

  // ── Tailwind classes (regex) ──
  c = c.replace(/\btext-purple-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-purple-\d+/g, 'bg-cyan-500');
  c = c.replace(/\btext-green-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-green-\d+/g, 'bg-cyan-500');
  c = c.replace(/\btext-amber-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-amber-\d+/g, 'bg-cyan-500');
  c = c.replace(/\btext-blue-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-blue-\d+/g, 'bg-cyan-500');

  // ── Restore cyan-purple gradient (both slots → both cyan is wrong) ──
  c = c.split('linear-gradient(135deg, #00D4FF, #00D4FF)').join('linear-gradient(135deg, #00D4FF, #7C3AED)');
  c = c.split('linear-gradient(135deg, #00D4FF 0%, #00D4FF 100%)').join('linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)');
  c = c.split('linear-gradient(135deg,#00D4FF,#00D4FF)').join('linear-gradient(135deg,#00D4FF,#7C3AED)');

  if (c !== before) {
    fs.writeFileSync(file, c, 'utf8');
    console.log('Updated:', path.basename(file));
  } else {
    console.log('Unchanged:', path.basename(file));
  }
}

// ── VERIFY ──
const STALE = [
  'rgba(124,58,237','rgba(109,40,217','rgba(167,139,250','rgba(139,92,246',
  'rgba(245,158,11','rgba(251,191,36',
  'rgba(34,197,94','rgba(16,185,129',
  '#7c3aed','#f59e0b','#10b981','#22c55e',
  'text-green-','bg-green-','text-purple-\\d','bg-purple-\\d',
];
let issues = 0;
for (const file of FILES) {
  const c = fs.readFileSync(file, 'utf8');
  const found = [];
  ['rgba(124,58,237','rgba(109,40,217','rgba(167,139,250','rgba(245,158,11','rgba(251,191,36','rgba(34,197,94','rgba(16,185,129','#7c3aed','#7C3AED','#f59e0b','#10b981','#22c55e'].forEach(s => {
    let n=0,i=0; while((i=c.indexOf(s,i))!==-1){n++;i++;} if(n) found.push(s+'('+n+')');
  });
  if (found.length) { console.log('STILL:', path.basename(file), found.join(' ')); issues++; }
}
if (!issues) console.log('All clean!');
