const fs = require('fs');

// ── MAINPAGE ─────────────────────────────────────────────────────────────────
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// Amber → blue
c = c.split('#f59e0b').join('#60A5FA');
c = c.split('#fbbf24').join('#60A5FA');
c = c.split('rgba(245,158,11').join('rgba(59,130,246');

// Green → blue
c = c.split('#10b981').join('#3B82F6');
c = c.split('rgba(16,185,129').join('rgba(59,130,246');

// Cyan/sky → blue family
c = c.split('#0ea5e9').join('#60A5FA');
c = c.split('#38bdf8').join('#93C5FD');
c = c.split('#0891b2').join('#60A5FA');

// Dark navy + mid-blue button gradient → clean blue gradient
// (used in Start Video / premium CTA buttons)
c = c.split('linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)').join('linear-gradient(135deg, #1d4ed8 0%, #3B82F6 100%)');
c = c.split('linear-gradient(140deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)').join('linear-gradient(135deg, #1d4ed8 0%, #3B82F6 100%)');

// HOW IT WORKS card 1 color (single value, was #2563eb — now remaining ones)
// Safety card 1 color (same)
// These will be caught by a targeted split since the button gradients above are already replaced
c = c.split("color: '#2563eb'").join("color: '#3B82F6'");
c = c.split('color: "#2563eb"').join('color: "#3B82F6"');

// Any remaining #2563eb standalone (not in a gradient)
c = c.split('#2563eb').join('#3B82F6');

// Headline gradient in hero (0ea5e9 already handled above, but check the 60a5fa/0ea5e9 combo)
c = c.split("linear-gradient(125deg, #60a5fa 0%, #0ea5e9 65%)").join("linear-gradient(125deg, #3B82F6 0%, #60A5FA 100%)");
c = c.split("linear-gradient(125deg, #60a5fa 0%, #60A5FA 65%)").join("linear-gradient(125deg, #3B82F6 0%, #60A5FA 100%)");

// Purple → blue (any remaining)
c = c.split('#7c3aed').join('#3B82F6');
c = c.split('#6d28d9').join('#2563eb');
c = c.split('#8b5cf6').join('#60A5FA');
c = c.split('rgba(124,58,237').join('rgba(59,130,246');
c = c.split('rgba(139,92,246').join('rgba(59,130,246');
c = c.split('rgba(109,40,217').join('rgba(59,130,246');

// FAQ label: className with vybe-purple-light → inline style
c = c.split(
  'className="text-[11px] font-black tracking-[0.2em] text-vybe-purple-light uppercase mb-3"'
).join(
  'className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: \'#60A5FA\' }}'
);

// Trust & Safety label: vybe-purple-light → blue (if any remains)
c = c.split('text-vybe-purple-light').join('text-blue-400');
c = c.split('text-vybe-purple').join('text-blue-500');
c = c.split('vybe-purple').join('blue-500');

// HOW IT WORKS card bg: rgba(255,255,255,0.025) + rgba(255,255,255,0.06) → dark card
// (only the HOW IT WORKS and safety section use this pattern)
c = c.split("background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)'").join(
  "background: 'rgba(6,11,20,0.6)', border: '1px solid rgba(59,130,246,0.1)'"
);
c = c.split("background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)'").join(
  "background: 'rgba(6,11,20,0.6)', border: '1px solid rgba(59,130,246,0.1)'"
);

// Stats card bg
c = c.split("background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'").join(
  "background: 'rgba(6,11,20,0.7)', border: '1px solid rgba(59,130,246,0.1)'"
);

// HOW IT WORKS icon container (template literal style with color variable) → static blue
c = c.split('background: `${color}18`, border: `1px solid ${color}30`').join(
  "background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)'"
);
c = c.split('background: `${color}18`, border: `1px solid ${color}28`').join(
  "background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)'"
);

// Safety card hover: dynamic color template → static blue
c = c.split("borderColor: `${color}40`, boxShadow: `0 8px 28px ${color}18`").join(
  "borderColor: 'rgba(59,130,246,0.28)', boxShadow: '0 8px 28px rgba(59,130,246,0.1)'"
);
c = c.split("borderColor: `${color}40`, boxShadow: `0 12px 32px ${color}18`").join(
  "borderColor: 'rgba(59,130,246,0.28)', boxShadow: '0 12px 40px rgba(59,130,246,0.1)'"
);

// HOW IT WORKS step number: background: color → static blue
c = c.split("text-white\" style={{ background: color }}>{i + 1}</span>").join(
  "text-white\" style={{ background: '#3B82F6' }}>{i + 1}</span>"
);

// Creator "For Creators" badge container: amber rgba already caught above
// Creator section container: amber linear-gradient
c = c.split(
  "background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid rgba(59,130,246,0.12)'"
).join(
  "background: 'rgba(6,11,20,0.5)', border: '1px solid rgba(59,130,246,0.12)'"
);
// The rgba(245,158,11 was already caught by the split above, just fix the creator badge border which is still rgba(59,130,246,0.22) — already correct

// Membership section container
c = c.split(
  "background: 'linear-gradient(160deg, rgba(47,107,255,0.07) 0%, rgba(5,8,22,0) 100%)', border: '1px solid rgba(80,140,255,0.14)'"
).join(
  "background: 'rgba(6,11,20,0.5)', border: '1px solid rgba(59,130,246,0.12)'"
);

// Membership "filters" gradient (already 2563eb→3B82F6 above via split, but check the exact string)
c = c.split("linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)").join(
  "linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)"
);
// This one was already caught by the individual color replacements above

// FAQ: "Questions" span class → inline gradient
c = c.split('<span className="text-purple-gradient">Questions</span>').join(
  '<span style={{ background: \'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)\', WebkitBackgroundClip: \'text\', WebkitTextFillColor: \'transparent\', backgroundClip: \'text\' }}>Questions</span>'
);

// FAQ isOpen class colors
c = c.split("isOpen ? 'bg-vybe-purple/20 text-vybe-purple-light' : 'text-vybe-muted'").join("''");

// FAQ open item background
c = c.split("isOpen ? 'linear-gradient(160deg,#0e0e1d 0%,#0b0b19 100%)' : 'rgba(255,255,255,0.03)'").join(
  "isOpen ? 'rgba(6,11,24,0.8)' : 'rgba(6,11,20,0.4)'"
);

// FAQ item border
c = c.split("isOpen ? '1px solid rgba(27,98,245,0.3)' : '1px solid rgba(255,255,255,0.06)'").join(
  "isOpen ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(59,130,246,0.08)'"
);

// FAQ answer text class
c = c.split('<p className="px-5 pb-5 text-vybe-muted text-sm leading-relaxed">{item.a}</p>').join(
  '<p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: \'rgba(148,163,184,0.65)\' }}>{item.a}</p>'
);

// FAQ question text dynamic class
c = c.split('`font-semibold text-sm sm:text-[15px] transition-colors ${isOpen ? \'text-white\' : \'text-gray-400\'}`').join(
  '"font-semibold text-sm sm:text-[15px] transition-colors" style={{ color: isOpen ? \'white\' : \'rgba(186,200,225,0.65)\' }}'
);

// Grey desc text → slate
c = c.split("color: '#6b7280'").join("color: 'rgba(148,163,184,0.7)'");
c = c.split("color: 'rgba(156,163,175,0.7)'").join("color: 'rgba(148,163,184,0.5)'");

// #7AACFF normalise
c = c.split('#7AACFF').join('#60A5FA');
c = c.split("'#7aacff'").join("'#60A5FA'");

// Mobile purple
c = c.split("'rgba(124,58,237").join("'rgba(59,130,246");

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');

// Verify
const after = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');
const stillBad = [
  '#f59e0b','#fbbf24','rgba(245,158,11','#10b981','rgba(16,185,129',
  '#0ea5e9','#38bdf8','#7c3aed','#8b5cf6','vybe-purple',
  'text-purple-gradient','bg-vybe-purple',
];
stillBad.forEach(s => {
  let count = 0, idx = 0;
  while ((idx = after.indexOf(s, idx)) !== -1) { count++; idx++; }
  if (count) console.log('STILL PRESENT:', s, '(' + count + ')');
});
console.log('MainPage: done');

// ── NAVBAR ────────────────────────────────────────────────────────────────────
let nb = fs.readFileSync('frontend/src/components/Navbar.jsx', 'utf8');
nb = nb.split('text-vybe-purple').join('text-blue-400');
nb = nb.split('bg-vybe-purple').join('bg-blue-500');
nb = nb.split('vybe-purple').join('blue-500');
nb = nb.split('bg-purple-600').join('bg-blue-600');
nb = nb.split('text-purple-600').join('text-blue-500');
nb = nb.split('#7c3aed').join('#3B82F6');
nb = nb.split('rgba(124,58,237').join('rgba(59,130,246');
fs.writeFileSync('frontend/src/components/Navbar.jsx', nb, 'utf8');
console.log('Navbar: done');

// ── FOOTER ────────────────────────────────────────────────────────────────────
const fp = 'frontend/src/components/Footer.jsx';
if (fs.existsSync(fp)) {
  let ft = fs.readFileSync(fp, 'utf8');
  ft = ft.split('vybe-purple').join('blue-500');
  ft = ft.split('#7c3aed').join('#3B82F6');
  ft = ft.split('#6d28d9').join('#2563eb');
  ft = ft.split('rgba(124,58,237').join('rgba(59,130,246');
  ft = ft.split('rgba(139,92,246').join('rgba(59,130,246');
  fs.writeFileSync(fp, ft, 'utf8');
  console.log('Footer: done');
}

console.log('\nAll done!');
