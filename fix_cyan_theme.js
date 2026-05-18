const fs = require('fs');
const path = require('path');

// ── FILES TO PROCESS ─────────────────────────────────────────────────────────
function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', 'dist', '.git'].includes(e.name)) walk(full, results);
    else if (e.isFile() && (e.name.endsWith('.jsx') || e.name.endsWith('.js')) && !e.name.startsWith('fix_')) results.push(full);
  }
  return results;
}
const files = walk('frontend/src');

// ── REPLACEMENT MAP ───────────────────────────────────────────────────────────
// Order matters: more specific (longer) strings first to avoid partial matches
function applyReplacements(c) {

  // ── BACKGROUND COLORS (inline hex) ──
  c = c.split('#050816').join('#0a0a0f');
  c = c.split('#07070e').join('#0a0a0f');
  c = c.split('#08080f').join('#0a0a0f');
  c = c.split('#070713').join('#0a0a0f');
  c = c.split('#080e1c').join('#0d0d18');
  c = c.split('#0a0a16').join('#0d0d18');
  c = c.split('#0b0b19').join('#0d0d18');
  c = c.split('#0c0c1a').join('#0d0d18');
  c = c.split('#0d0d1b').join('#111120');
  c = c.split('#0e0e1d').join('#111120');
  c = c.split('#101020').join('#111120');
  c = c.split('#131325').join('#16162e');
  c = c.split('#181828').join('#1e1e2e');
  c = c.split('#1e1e35').join('#252538');

  // ── BACKGROUND rgba ──
  c = c.split('rgba(5,8,22').join('rgba(10,10,15');
  c = c.split('rgba(5, 8, 22').join('rgba(10,10,15');
  c = c.split('rgba(6,11,20').join('rgba(10,10,15');
  c = c.split('rgba(6,11,24').join('rgba(13,13,24');
  c = c.split('rgba(8,12,28').join('rgba(13,13,24');
  c = c.split('rgba(8,8,18').join('rgba(13,13,24');
  c = c.split('rgba(10,18,40').join('rgba(13,13,24');
  c = c.split('rgba(10, 18, 40').join('rgba(13,13,24');
  c = c.split('rgba(12,12,26').join('rgba(13,13,24');
  c = c.split('rgba(7,7,14').join('rgba(10,10,15');

  // ── PRIMARY BLUE → CYAN (hex) ──
  // More specific long values first
  c = c.split('#2056e8').join('#00B8E0');
  c = c.split('#1e3a8a').join('#004466');
  c = c.split('#1d4ed8').join('#0099BB');
  c = c.split('#2563eb').join('#00D4FF');
  c = c.split('#1B62F5').join('#00D4FF');
  c = c.split('#1b62f5').join('#00D4FF');
  c = c.split('#2F6BFF').join('#00D4FF');
  c = c.split('#2f6bff').join('#00D4FF');
  c = c.split('#4B88F7').join('#00B8E0');
  c = c.split('#4b88f7').join('#00B8E0');
  c = c.split('#4D8DFF').join('#00B8E0');
  c = c.split('#4d8dff').join('#00B8E0');
  c = c.split('#3B82F6').join('#00D4FF');
  c = c.split('#3b82f6').join('#00D4FF');
  c = c.split('#60A5FA').join('#00B8E0');
  c = c.split('#60a5fa').join('#00B8E0');
  c = c.split('#93C5FD').join('rgba(0,212,255,0.55)');
  c = c.split('#93c5fd').join('rgba(0,212,255,0.55)');
  c = c.split('#7AACFF').join('#00B8E0');
  c = c.split('#7aacff').join('#00B8E0');
  c = c.split('#0099BB').join('#0099BB'); // keep as-is (already correct)
  c = c.split('#818cf8').join('#7C3AED'); // indigo → keep as purple

  // ── BLUE rgba → CYAN rgba ──
  // Most specific first
  c = c.split('rgba(27,98,245').join('rgba(0,212,255');
  c = c.split('rgba(27, 98, 245').join('rgba(0,212,255');
  c = c.split('rgba(47,107,255').join('rgba(0,212,255');
  c = c.split('rgba(80,140,255').join('rgba(0,212,255');
  c = c.split('rgba(75,136,247').join('rgba(0,184,224');
  c = c.split('rgba(59,130,246').join('rgba(0,212,255');
  c = c.split('rgba(59, 130, 246').join('rgba(0,212,255');
  c = c.split('rgba(37,99,235').join('rgba(0,212,255');
  c = c.split('rgba(29,78,216').join('rgba(0,153,187');
  c = c.split('rgba(30,58,138').join('rgba(0,68,102');
  c = c.split('rgba(21,101,216').join('rgba(0,212,255');
  c = c.split('rgba(32,86,232').join('rgba(0,212,255');
  c = c.split('rgba(14,165,233').join('rgba(0,212,255');
  c = c.split('rgba(96,165,250').join('rgba(0,184,224');
  c = c.split('rgba(0, 212, 255').join('rgba(0,212,255'); // normalise spaces

  // ── HERO GRADIENTS ──
  c = c.split("linear-gradient(120deg,#2F6BFF 0%,#60A5FA 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(120deg, #2F6BFF 0%, #60A5FA 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(120deg, #00D4FF 0%, #00B8E0 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(125deg, #3B82F6 0%, #60A5FA 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(125deg, #60a5fa 0%, #60A5FA 65%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  // Keep main headline gradient as cyan→purple (already will be from above replacements)

  // ── BUTTON GRADIENTS ──
  c = c.split("linear-gradient(135deg, #2056e8 0%, #2F6BFF 50%, #4D8DFF 100%)").join("linear-gradient(135deg, #00B8E0 0%, #00D4FF 60%, #33DDFF 100%)");
  c = c.split("linear-gradient(135deg, #2056e8 0%, #00D4FF 50%, #00B8E0 100%)").join("linear-gradient(135deg, #00B8E0 0%, #00D4FF 60%, #33DDFF 100%)");
  c = c.split("linear-gradient(135deg, #1d4ed8 0%, #3B82F6 100%)").join("linear-gradient(135deg, #0099BB 0%, #00D4FF 100%)");
  c = c.split("linear-gradient(135deg, #0099BB 0%, #00D4FF 100%)").join("linear-gradient(135deg, #0099BB 0%, #00D4FF 100%)"); // keep

  // ── ONLINE DOT: green → cyan ──
  c = c.split('#22c55e').join('#00D4FF');
  c = c.split('#22C55E').join('#00D4FF');
  c = c.split("rgba(34,197,94").join("rgba(0,212,255");
  c = c.split("rgba(34, 197, 94").join("rgba(0,212,255");
  // Keep #00FF87 success green intact (already correct)

  // ── VYBE LOGO: VY span gradient → cyan ──
  c = c.split("linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)").join("#00D4FF");
  // After above, the style object with WebkitBackgroundClip etc won't work with a plain color
  // Fix: replace the whole logo VY style
  c = c.split(
    "background: '#00D4FF',\n              WebkitBackgroundClip: 'text',\n              WebkitTextFillColor: 'transparent',\n              backgroundClip: 'text',"
  ).join("color: '#00D4FF',");
  // Also handle if it's on one line or different whitespace — do a simpler approach:
  // Find the VY span style and set to solid cyan
  const VY_OLD = `style={{\n              background: '#00D4FF',\n              WebkitBackgroundClip: 'text',\n              WebkitTextFillColor: 'transparent',\n              backgroundClip: 'text',\n            }}`;
  const VY_NEW = `style={{ color: '#00D4FF' }}`;
  // Use indexOf for CRLF-safe replacement
  const vyIdx = c.indexOf("background: '#00D4FF'");
  if (vyIdx >= 0) {
    // Find the wrapping style={{ ... }} for this span
    const styleStart = c.lastIndexOf('style={{', vyIdx);
    const styleEnd = c.indexOf('}}', vyIdx) + 2;
    if (styleStart >= 0 && styleEnd > styleStart) {
      c = c.slice(0, styleStart) + "style={{ color: '#00D4FF' }}" + c.slice(styleEnd);
    }
  }

  // ── BORDER COLORS ──
  c = c.split('rgba(80,140,255,0.07)').join('rgba(0,212,255,0.07)');
  c = c.split('rgba(80,140,255,0.09)').join('rgba(0,212,255,0.09)');
  c = c.split('rgba(80,140,255,0.1)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(80,140,255,0.14)').join('rgba(0,212,255,0.14)');
  c = c.split('rgba(80,140,255,0.15)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(80,140,255,0.18)').join('rgba(0,212,255,0.18)');
  c = c.split('rgba(80,140,255,0.2)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(80,140,255,0.22)').join('rgba(0,212,255,0.22)');
  c = c.split('rgba(80,140,255,0.28)').join('rgba(0,212,255,0.28)');
  c = c.split('rgba(80,140,255,0.3)').join('rgba(0,212,255,0.3)');
  c = c.split('rgba(80,140,255,0.5)').join('rgba(0,212,255,0.5)');
  c = c.split('rgba(80,140,255,0.6)').join('rgba(0,212,255,0.6)');

  // ── BOX SHADOWS ──
  c = c.split('0 0 16px rgba(47,107,255,0.3)').join('0 0 20px rgba(0,212,255,0.3)');
  c = c.split('0 0 20px rgba(47,107,255,0.35)').join('0 0 20px rgba(0,212,255,0.3)');
  c = c.split('0 4px 24px rgba(47,107,255,0.35)').join('0 4px 24px rgba(0,212,255,0.3)');
  c = c.split('0 4px 28px rgba(47,107,255,0.38)').join('0 4px 28px rgba(0,212,255,0.35)');
  c = c.split('0 2px 10px rgba(47,107,255,0.4)').join('0 2px 10px rgba(0,212,255,0.4)');
  c = c.split('0 0 80px rgba(47,107,255,0.07)').join('0 0 80px rgba(0,212,255,0.07)');
  c = c.split('0 0 40px rgba(47,107,255,0.08)').join('0 0 40px rgba(0,212,255,0.08)');
  c = c.split('0 12px 40px rgba(59,130,246,0.1)').join('0 12px 40px rgba(0,212,255,0.1)');
  c = c.split('0 8px 28px rgba(59,130,246,0.1)').join('0 8px 28px rgba(0,212,255,0.1)');
  c = c.split('borderColor: \'rgba(59,130,246,0.28)\'').join('borderColor: \'rgba(0,212,255,0.28)\'');

  // ── ANNOUNCEMENT STRIP ──
  c = c.split("background: '#2F6BFF'").join("background: '#00D4FF'");
  c = c.split('background: "#2F6BFF"').join('background: "#00D4FF"');

  // ── FILTER ACTIVE BUTTON ──
  c = c.split("background: '#2F6BFF', color: 'white', boxShadow: '0 2px 10px rgba(0,212,255,0.4)'").join(
    "background: '#00D4FF', color: '#0a0a0f', boxShadow: '0 2px 10px rgba(0,212,255,0.4)'"
  );

  // Cyan text on dark bg (active states) — keep text dark on cyan bg
  c = c.split("background: '#00D4FF', color: 'white'").join("background: '#00D4FF', color: '#0a0a0f'");

  // ── MISC INLINE COLORS ──
  c = c.split("color: '#4D8DFF'").join("color: '#00D4FF'");
  c = c.split("color: '#4d8dff'").join("color: '#00D4FF'");
  c = c.split("color: '#2F6BFF'").join("color: '#00D4FF'");
  c = c.split("color: '#2f6bff'").join("color: '#00D4FF'");

  // ── ANNOUNCE BUTTON COLOR ──
  c = c.split("color: '#4D8DFF'").join("color: '#00B8E0'");
  c = c.split("color: '#00B8E0'").join("color: '#00B8E0'"); // normalise

  // ── CARD BORDERS post-replacements ──
  c = c.split("border: '1px solid rgba(59,130,246,0.1)'").join("border: '1px solid rgba(0,212,255,0.1)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.08)'").join("border: '1px solid rgba(0,212,255,0.08)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.12)'").join("border: '1px solid rgba(0,212,255,0.12)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.18)'").join("border: '1px solid rgba(0,212,255,0.18)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.2)'").join("border: '1px solid rgba(0,212,255,0.2)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.22)'").join("border: '1px solid rgba(0,212,255,0.22)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.25)'").join("border: '1px solid rgba(0,212,255,0.25)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.28)'").join("border: '1px solid rgba(0,212,255,0.28)'");
  c = c.split("border: '1px solid rgba(59,130,246,0.3)'").join("border: '1px solid rgba(0,212,255,0.3)'");

  // ── REMAINING 0,212,255 border/shadow strings (from earlier partial replacements) ──
  c = c.split("rgba(0,212,255,0.06) inset").join("rgba(0,212,255,0.06) inset"); // keep
  c = c.split("rgba(0,212,255,0.1) inset").join("rgba(0,212,255,0.1) inset");   // keep

  // ── COUNTRY DROPDOWN ──
  c = c.split("background: 'rgba(8,12,28,0.97)'").join("background: 'rgba(13,13,24,0.97)'");
  c = c.split("border: '1px solid rgba(80,140,255,0.18)'").join("border: '1px solid rgba(0,212,255,0.18)'");
  c = c.split("background: 'rgba(47,107,255,0.12)'").join("background: 'rgba(0,212,255,0.1)'");
  c = c.split("background: 'rgba(47,107,255,0.1)'").join("background: 'rgba(0,212,255,0.1)'");

  // ── NAVBAR ──
  c = c.split("'rgba(80,140,255,0.07)'").join("'rgba(0,212,255,0.07)'");
  c = c.split('bg-blue-500').join('bg-cyan-400');
  c = c.split('bg-blue-600').join('bg-cyan-500');
  c = c.split('text-blue-400').join('text-cyan-400');
  c = c.split('text-blue-500').join('text-cyan-400');
  c = c.split('blue-500').join('cyan-400');  // tailwind classes vybe-purple→blue-500→cyan-400

  // ── VIP BADGE gradient ──
  c = c.split("linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");
  c = c.split("linear-gradient(135deg, #00D4FF 0%, #00B8E0 100%)").join("linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)");

  // ── CAMERA PANEL CARD BACKGROUND ──
  c = c.split("background: '#080e1c'").join("background: '#0d0d18'");
  c = c.split("background: '#0d0d18'").join("background: '#0d0d18'"); // keep

  // ── TEXT COLORS ──
  c = c.split("'#eeeef5'").join("'#ffffff'");
  c = c.split('"#eeeef5"').join('"#ffffff"');
  c = c.split("color: '#55606e'").join("color: '#888899'");
  c = c.split("color: '#6b7280'").join("color: '#888899'");
  c = c.split("color: '#9ca3af'").join("color: '#888899'");
  c = c.split("'rgba(148,163,184,0.7)'").join("'rgba(180,190,210,0.65)'");
  c = c.split("'rgba(148,163,184,0.65)'").join("'rgba(180,190,210,0.6)'");
  c = c.split("'rgba(148,163,184,0.5)'").join("'rgba(180,190,210,0.5)'");

  return c;
}

// ── PROCESS ALL FILES ─────────────────────────────────────────────────────────
let totalFiles = 0;
let changedFiles = 0;

for (const file of files) {
  try {
    const original = fs.readFileSync(file, 'utf8');
    const updated = applyReplacements(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      changedFiles++;
      console.log('Updated:', file.replace('frontend/src/', ''));
    }
    totalFiles++;
  } catch (e) {
    console.error('Error on', file, e.message);
  }
}

console.log('\nProcessed:', totalFiles, 'files,', changedFiles, 'changed');

// ── VERIFY remaining blue in MainPage ────────────────────────────────────────
const mp = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');
const checks = ['#1B62F5','#2F6BFF','#3B82F6','#60A5FA','rgba(27,98,245','rgba(47,107,255','rgba(59,130,246','#22c55e','rgba(34,197,94'];
checks.forEach(s => {
  let n = 0, i = 0;
  while ((i = mp.indexOf(s, i)) !== -1) { n++; i++; }
  if (n) console.log('STILL PRESENT in MainPage:', s, '(' + n + ')');
});
console.log('Done!');
