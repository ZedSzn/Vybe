const fs = require('fs');

// ── 1. index.css — revert class rename (keep name, gradient already correct) ──
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
css = css.split('.text-cyan-purple-gradient {').join('.text-purple-gradient {');
fs.writeFileSync('frontend/src/index.css', css, 'utf8');
console.log('index.css: class name restored');

// ── 2. Button.jsx — purple primary gradient → cyan ──
let btn = fs.readFileSync('frontend/src/components/Button.jsx', 'utf8');
btn = btn.split("linear-gradient(140deg, #7c3aed 0%, #00B8E0 55%, #0099BB 100%)").join("linear-gradient(135deg, #00B8E0 0%, #00D4FF 55%, #33DDFF 100%)");
btn = btn.split("linear-gradient(140deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)").join("linear-gradient(135deg, #00B8E0 0%, #00D4FF 55%, #33DDFF 100%)");
// any remaining purple hex
btn = btn.split('#7c3aed').join('#00D4FF');
btn = btn.split('#6d28d9').join('#00B8E0');
btn = btn.split('#5b21b6').join('#0099BB');
fs.writeFileSync('frontend/src/components/Button.jsx', btn, 'utf8');
console.log('Button.jsx: fixed');

// ── 3. PremiumModal.jsx — amber → cyan ──
let pm = fs.readFileSync('frontend/src/components/PremiumModal.jsx', 'utf8');
pm = pm.split('#f59e0b').join('#00D4FF');
pm = pm.split('rgba(245,158,11,0.12)').join('rgba(0,212,255,0.1)');
pm = pm.split('rgba(245,158,11,0.15)').join('rgba(0,212,255,0.12)');
pm = pm.split('rgba(245,158,11,0.2)').join('rgba(0,212,255,0.15)');
pm = pm.split('rgba(245,158,11,0.25)').join('rgba(0,212,255,0.2)');
pm = pm.split('rgba(245,158,11,0.3)').join('rgba(0,212,255,0.25)');
pm = pm.split('rgba(245,158,11,0.4)').join('rgba(0,212,255,0.3)');
fs.writeFileSync('frontend/src/components/PremiumModal.jsx', pm, 'utf8');
console.log('PremiumModal.jsx: fixed');

// ── 4. WalletPage.jsx — purple gradients → cyan-purple / fix order ──
let wp = fs.readFileSync('frontend/src/pages/WalletPage.jsx', 'utf8');
wp = wp.split('rgba(124,58,237,0.12)').join('rgba(0,212,255,0.1)');
wp = wp.split('rgba(124,58,237,0.15)').join('rgba(0,212,255,0.12)');
wp = wp.split('rgba(124,58,237,0.2)').join('rgba(0,212,255,0.15)');
wp = wp.split('rgba(124,58,237,0.3)').join('rgba(0,212,255,0.25)');
wp = wp.split("linear-gradient(135deg,#7c3aed,#00D4FF)").join("linear-gradient(135deg, #00D4FF, #7C3AED)");
wp = wp.split("linear-gradient(135deg,#a855f7,#7c3aed)").join("linear-gradient(135deg, #00D4FF, #7C3AED)");
wp = wp.split("linear-gradient(135deg,#7c3aed,#").join("linear-gradient(135deg, #00D4FF, #");
wp = wp.split('#7c3aed').join('#00D4FF');
wp = wp.split('#a855f7').join('#7C3AED');
wp = wp.split("'rgba(124,58,237").join("'rgba(0,212,255");
fs.writeFileSync('frontend/src/pages/WalletPage.jsx', wp, 'utf8');
console.log('WalletPage.jsx: fixed');

// ── 5. ChatPage.jsx — amber UI colors → cyan ──
let chat = fs.readFileSync('frontend/src/pages/ChatPage.jsx', 'utf8');
// Toast/notification "amber" variant
chat = chat.split("bg = 'rgba(245,158,11,0.16)'; border = '1px solid rgba(245,158,11,0.38)'; glow = '0 0 14").join(
           "bg = 'rgba(0,212,255,0.12)'; border = '1px solid rgba(0,212,255,0.35)'; glow = '0 0 14");
// Find and replace all amber rgba in ChatPage
let idx = 0;
while ((idx = chat.indexOf('rgba(245,158,11', idx)) !== -1) {
  // Get the opacity
  const end = chat.indexOf(')', idx);
  const full = chat.slice(idx, end + 1);
  const opacity = parseFloat(full.match(/[\d.]+\)$/)[0]);
  let newAlpha = Math.min(opacity, 0.4);
  chat = chat.slice(0, idx) + 'rgba(0,212,255,' + newAlpha + ')' + chat.slice(end + 1);
  idx += 'rgba(0,212,255,'.length + String(newAlpha).length + 1;
}
// Purple gradients in VIP badges — keep as cyan-to-purple (they're correct)
// Remaining purple hex
chat = chat.split("background: 'linear-gradient(135deg, #7c3aed, #00D4FF)'").join("background: 'linear-gradient(135deg, #00D4FF, #7C3AED)'");
chat = chat.split('#7c3aed').join('#7C3AED'); // normalise case, keep as gradient secondary
fs.writeFileSync('frontend/src/pages/ChatPage.jsx', chat, 'utf8');
console.log('ChatPage.jsx: fixed');

// ── 6. SubscriptionPage.jsx — amber → cyan ──
let sub = fs.readFileSync('frontend/src/pages/SubscriptionPage.jsx', 'utf8');
sub = sub.split('#f59e0b').join('#00D4FF');
sub = sub.split('#fbbf24').join('#00B8E0');
let si = 0;
while ((si = sub.indexOf('rgba(245,158,11', si)) !== -1) {
  const end = sub.indexOf(')', si);
  const opacity = parseFloat(sub.slice(si, end + 1).match(/[\d.]+\)$/)[0]);
  sub = sub.slice(0, si) + 'rgba(0,212,255,' + Math.min(opacity, 0.4) + ')' + sub.slice(end + 1);
  si++;
}
fs.writeFileSync('frontend/src/pages/SubscriptionPage.jsx', sub, 'utf8');
console.log('SubscriptionPage.jsx: fixed');

// ── 7. AdminDashboard.jsx — amber → cyan ──
let ad = fs.readFileSync('frontend/src/pages/AdminDashboard.jsx', 'utf8');
let ai = 0;
while ((ai = ad.indexOf('rgba(245,158,11', ai)) !== -1) {
  const end = ad.indexOf(')', ai);
  const opacity = parseFloat(ad.slice(ai, end + 1).match(/[\d.]+\)$/)[0]);
  ad = ad.slice(0, ai) + 'rgba(0,212,255,' + Math.min(opacity, 0.4) + ')' + ad.slice(end + 1);
  ai++;
}
fs.writeFileSync('frontend/src/pages/AdminDashboard.jsx', ad, 'utf8');
console.log('AdminDashboard.jsx: fixed');

console.log('\nDone! Remaining text-purple-gradient class usages are fine (CSS is updated).');
