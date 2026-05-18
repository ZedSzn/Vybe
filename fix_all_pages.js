const fs = require('fs');
const path = require('path');

const PAGES = [
  'frontend/src/pages/TermsPage.jsx',
  'frontend/src/pages/PrivacyPage.jsx',
  'frontend/src/pages/GuidelinesPage.jsx',
  'frontend/src/pages/EarnPage.jsx',
  'frontend/src/pages/ChatPage.jsx',
  'frontend/src/pages/AuthPage.jsx',
  'frontend/src/pages/SettingsPage.jsx',
  'frontend/src/pages/ProfilePage.jsx',
  'frontend/src/pages/CoinsPage.jsx',
  'frontend/src/pages/FriendsPage.jsx',
  'frontend/src/pages/SubscriptionPage.jsx',
  'frontend/src/pages/WalletPage.jsx',
  'frontend/src/pages/AdminDashboard.jsx',
  'frontend/src/pages/AdminLoginPage.jsx',
  'frontend/src/pages/AdminPage.jsx',
  'frontend/src/pages/ResetPasswordPage.jsx',
  'frontend/src/pages/ForgotPasswordPage.jsx',
  'frontend/src/pages/VerifyEmailPage.jsx',
  'frontend/src/pages/UnbanSuccessPage.jsx',
  'frontend/src/pages/SquadJoinPage.jsx',
  'frontend/src/pages/PrivateRoomJoinPage.jsx',
  'frontend/src/components/Button.jsx',
  'frontend/src/components/Card.jsx',
  'frontend/src/components/Input.jsx',
  'frontend/src/components/Navbar.jsx',
  'frontend/src/components/Footer.jsx',
  'frontend/src/components/PremiumModal.jsx',
  'frontend/src/components/VybeBadge.jsx',
  'frontend/src/components/ContactModal.jsx',
];

function fix(c) {
  // ── PURPLE hex → cyan ──
  c = c.split('#7c3aed').join('#00D4FF');
  c = c.split('#7C3AED').join('#00D4FF');  // keep gradient secondary (will handle below)
  c = c.split('#6d28d9').join('#00B8E0');
  c = c.split('#5b21b6').join('#0099BB');
  c = c.split('#4f46e5').join('#00D4FF');
  c = c.split('#a855f7').join('#7C3AED');  // lighter purple → keep as gradient accent
  c = c.split('#9333ea').join('#00D4FF');
  // rgba purple → cyan
  c = c.split('rgba(124,58,237,0.06)').join('rgba(0,212,255,0.06)');
  c = c.split('rgba(124,58,237,0.08)').join('rgba(0,212,255,0.07)');
  c = c.split('rgba(124,58,237,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(124,58,237,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(124,58,237,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(124,58,237,0.18)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(124,58,237,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(124,58,237,0.25)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(124,58,237,0.3)').join('rgba(0,212,255,0.22)');
  c = c.split('rgba(124,58,237,0.35)').join('rgba(0,212,255,0.25)');
  c = c.split('rgba(124,58,237,0.4)').join('rgba(0,212,255,0.3)');
  c = c.split('rgba(124,58,237,0.5)').join('rgba(0,212,255,0.4)');
  c = c.split('rgba(124,58,237,0.6)').join('rgba(0,212,255,0.5)');
  c = c.split('rgba(124,58,237,0.7)').join('rgba(0,212,255,0.6)');
  c = c.split('rgba(109,40,217,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(109,40,217,0.15)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(109,40,217,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(167,139,250,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(167,139,250,0.15)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(167,139,250,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(167,139,250,0.3)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(167,139,250,0.4)').join('rgba(0,212,255,0.3)');

  // ── AMBER/YELLOW → cyan (UI context, not coin icons) ──
  c = c.split('#f59e0b').join('#00D4FF');
  c = c.split('#fbbf24').join('#00B8E0');
  c = c.split('#d97706').join('#0099BB');
  c = c.split("color: '#FFB800'").join("color: '#00D4FF'");
  c = c.split('rgba(245,158,11,0.06)').join('rgba(0,212,255,0.06)');
  c = c.split('rgba(245,158,11,0.08)').join('rgba(0,212,255,0.07)');
  c = c.split('rgba(245,158,11,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(245,158,11,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(245,158,11,0.14)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(245,158,11,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(245,158,11,0.18)').join('rgba(0,212,255,0.14)');
  c = c.split('rgba(245,158,11,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(245,158,11,0.25)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(245,158,11,0.3)').join('rgba(0,212,255,0.22)');
  c = c.split('rgba(245,158,11,0.35)').join('rgba(0,212,255,0.25)');
  c = c.split('rgba(245,158,11,0.4)').join('rgba(0,212,255,0.3)');
  c = c.split('rgba(245,158,11,0.45)').join('rgba(0,212,255,0.35)');
  c = c.split('rgba(245,158,11,0.5)').join('rgba(0,212,255,0.4)');
  c = c.split('rgba(251,191,36,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(251,191,36,0.15)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(251,191,36,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(251,191,36,0.3)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(251,191,36,0.4)').join('rgba(0,212,255,0.3)');
  c = c.split('rgba(251,191,36,0.5)').join('rgba(0,212,255,0.4)');

  // ── GREEN → cyan (UI context: online dots, success states, badges) ──
  c = c.split('#22c55e').join('#00D4FF');
  c = c.split('#16a34a').join('#00B8E0');
  c = c.split('#15803d').join('#0099BB');
  c = c.split('#10b981').join('#00D4FF');
  c = c.split('#059669').join('#00B8E0');
  c = c.split('#34d399').join('#33DDFF');
  // rgba green → cyan
  c = c.split('rgba(34,197,94,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(34,197,94,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(34,197,94,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(34,197,94,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(34,197,94,0.25)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(34,197,94,0.3)').join('rgba(0,212,255,0.25)');
  c = c.split('rgba(16,185,129,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(16,185,129,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(16,185,129,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(16,185,129,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(16,185,129,0.25)').join('rgba(0,212,255,0.2)');
  c = c.split('rgba(16,185,129,0.3)').join('rgba(0,212,255,0.25)');

  // ── TAILWIND GREEN CLASSES → cyan ──
  c = c.replace(/\btext-green-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-green-\d+/g, 'bg-cyan-500');
  c = c.replace(/\bborder-green-\d+/g, 'border-cyan-400');
  c = c.replace(/\bfrom-green-\d+/g, 'from-cyan-400');
  c = c.replace(/\bto-green-\d+/g, 'to-cyan-400');
  c = c.replace(/\bring-green-\d+/g, 'ring-cyan-400');
  c = c.replace(/\bhover:bg-green-\d+/g, 'hover:bg-cyan-500');
  c = c.replace(/\bhover:text-green-\d+/g, 'hover:text-cyan-400');
  c = c.replace(/\btext-yellow-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-yellow-\d+/g, 'bg-cyan-500');
  c = c.replace(/\btext-amber-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-amber-\d+/g, 'bg-cyan-500');
  c = c.replace(/\bfrom-amber-\d+/g, 'from-cyan-400');

  // ── TAILWIND PURPLE/INDIGO CLASSES → cyan ──
  c = c.replace(/\btext-purple-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-purple-\d+/g, 'bg-cyan-500');
  c = c.replace(/\bborder-purple-\d+/g, 'border-cyan-400');
  c = c.replace(/\bfrom-purple-\d+/g, 'from-cyan-400');
  c = c.replace(/\bto-purple-\d+/g, 'to-cyan-400');
  c = c.replace(/\bhover:text-purple-\d+/g, 'hover:text-cyan-400');
  c = c.replace(/\bhover:bg-purple-\d+/g, 'hover:bg-cyan-500');
  c = c.replace(/\btext-indigo-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-indigo-\d+/g, 'bg-cyan-500');
  c = c.replace(/\btext-violet-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-violet-\d+/g, 'bg-cyan-500');

  // ── TAILWIND BLUE CLASSES → cyan ──
  c = c.replace(/\btext-blue-\d+/g, 'text-cyan-400');
  c = c.replace(/\bbg-blue-\d+/g, 'bg-cyan-500');
  c = c.replace(/\bborder-blue-\d+/g, 'border-cyan-400');
  c = c.replace(/\bfrom-blue-\d+/g, 'from-cyan-400');
  c = c.replace(/\bto-blue-\d+/g, 'to-cyan-400');

  // ── REMAINING OLD BLUE HEX → cyan ──
  c = c.split('#1B62F5').join('#00D4FF');
  c = c.split('#1b62f5').join('#00D4FF');
  c = c.split('#2F6BFF').join('#00D4FF');
  c = c.split('#3B82F6').join('#00D4FF');
  c = c.split('#3b82f6').join('#00D4FF');
  c = c.split('#60A5FA').join('#00B8E0');
  c = c.split('#60a5fa').join('#00B8E0');
  c = c.split('rgba(27,98,245,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(27,98,245,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(27,98,245,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(27,98,245,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(27,98,245,0.3)').join('rgba(0,212,255,0.25)');
  c = c.split('rgba(47,107,255,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(47,107,255,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(47,107,255,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(47,107,255,0.2)').join('rgba(0,212,255,0.15)');
  c = c.split('rgba(59,130,246,0.1)').join('rgba(0,212,255,0.08)');
  c = c.split('rgba(59,130,246,0.12)').join('rgba(0,212,255,0.1)');
  c = c.split('rgba(59,130,246,0.15)').join('rgba(0,212,255,0.12)');
  c = c.split('rgba(59,130,246,0.2)').join('rgba(0,212,255,0.15)');

  // ── OLD BG HEX ──
  c = c.split("'#07070e'").join("'#0a0a0f'");
  c = c.split('"#07070e"').join('"#0a0a0f"');
  c = c.split("'#050816'").join("'#0a0a0f'");
  c = c.split('"#050816"').join('"#0a0a0f"');
  c = c.split("background: '#07070e'").join("background: '#0a0a0f'");
  c = c.split('background: "#07070e"').join('background: "#0a0a0f"');
  c = c.split("background: '#050816'").join("background: '#0a0a0f'");
  c = c.split("'#0d0d1b'").join("'#111120'");

  // ── RESTORE: gradients that use purple as SECONDARY are intentional ──
  // cyan-to-purple gradient: keep #7C3AED in linear-gradient(...#00D4FF...#7C3AED...) context
  // The replacements above turned #7C3AED → #00D4FF so restore gradient secondary purple
  c = c.split('linear-gradient(135deg, #00D4FF, #00D4FF)').join('linear-gradient(135deg, #00D4FF, #7C3AED)');
  c = c.split("linear-gradient(135deg, '#00D4FF', '#00D4FF')").join("linear-gradient(135deg, '#00D4FF', '#7C3AED')");
  // Fix cases where gradient had purple flipped
  c = c.split('linear-gradient(135deg, #00D4FF 0%, #00D4FF 100%)').join('linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)');

  return c;
}

let changed = 0;
for (const file of PAGES) {
  try {
    const original = fs.readFileSync(file, 'utf8');
    const updated = fix(original);
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log('Updated:', path.basename(file));
      changed++;
    } else {
      console.log('No change:', path.basename(file));
    }
  } catch (e) {
    console.error('Error:', file, e.message);
  }
}
console.log('\n' + changed + ' files updated');

// ── VERIFY ──
const STALE = [
  '#7c3aed','rgba(124,58,237','rgba(109,40,217','rgba(167,139,250',
  '#f59e0b','rgba(245,158,11','rgba(251,191,36',
  '#22c55e','rgba(34,197,94','#10b981','rgba(16,185,129',
  'text-green-','bg-green-','text-purple-','bg-purple-',
  'text-blue-','bg-blue-','text-indigo-','text-amber-','bg-amber-',
];
let issues = 0;
for (const file of PAGES) {
  try {
    const c = fs.readFileSync(file, 'utf8');
    const found = [];
    STALE.forEach(s => {
      let n=0,i=0; while((i=c.indexOf(s,i))!==-1){n++;i++;} if(n) found.push(s+'('+n+')');
    });
    if (found.length) { console.log('STILL:', path.basename(file), found.join(' ')); issues++; }
  } catch(e) {}
}
if (!issues) console.log('All clean!');
