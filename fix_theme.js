const fs = require('fs');

// ═══════════════════════════════════════════
// MIDNIGHT ELECTRIC BLUE PALETTE
// bg:      #050816
// primary: #3B82F6   (blue-500)
// hover:   #60A5FA   (blue-400)
// muted:   #93C5FD   (blue-300)
// glow:    rgba(59,130,246,0.35)
// card:    rgba(6,11,20,0.65)
// border:  rgba(59,130,246,0.14)
// ═══════════════════════════════════════════

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// ── HOW IT WORKS ──
// Replace the 3-card colors array (cyan/sky → blue family)
c = c.replace(
  `{ num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#2563eb' },\n            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#0ea5e9' },\n            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: '#38bdf8' },`,
  `{ num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#3B82F6' },\n            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#60A5FA' },\n            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: '#93C5FD' },`
);
// HOW IT WORKS heading gradient
c = c.replace(
  `background: 'linear-gradient(135deg, #2F6BFF 0%, #4D8DFF 55%, #7AACFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`,
  `background: 'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`
);
// Card bg/border: make them cleaner, less harsh
c = c.replace(
  `style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}\n              initial={{ opacity: 0, y: 20 }}\n              whileInView={{ opacity: 1, y: 0 }}\n              viewport={{ once: true }}\n              transition={{ delay: i * 0.1, duration: 0.5 }}\n              whileHover={{ y: -4, borderColor: \`\${color}40\`, boxShadow: \`0 12px 32px \${color}18\` }}`,
  `style={{ background: 'rgba(6,11,20,0.6)', border: '1px solid rgba(59,130,246,0.1)' }}\n              initial={{ opacity: 0, y: 20 }}\n              whileInView={{ opacity: 1, y: 0 }}\n              viewport={{ once: true }}\n              transition={{ delay: i * 0.1, duration: 0.5 }}\n              whileHover={{ y: -4, borderColor: 'rgba(59,130,246,0.28)', boxShadow: '0 12px 40px rgba(59,130,246,0.1)' }}`
);
// Card icon bg uses color variable — unify to blue
c = c.replace(
  `<div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: \`\${color}18\`, border: \`1px solid \${color}30\` }}>`,
  `<div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>`
);
// Card icon itself — use dynamic color (keep it to distinguish cards subtly)
// Step number bubble — use blue
c = c.replace(
  `<span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: color }}>{i + 1}</span>`,
  `<span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: '#3B82F6' }}>{i + 1}</span>`
);
// Card desc text color — brighten slightly
c = c.replace(
  `<p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>\n              </div>\n            </motion.div>\n          ))}\n        </div>\n      </section>`,
  `<p className="text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.7)' }}>{desc}</p>\n              </div>\n            </motion.div>\n          ))}\n        </div>\n      </section>`
);

// ── MEMBERSHIP ──
// VIP card: amber → blue
c = c.replace(
  `{ tier: 'VIP', price: '£12.99/mo', features: ['Filter by gender', 'Filter by country', 'VIP badge on profile'], borderColor: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.07)', labelColor: '#f59e0b', checkColor: '#f59e0b' },`,
  `{ tier: 'VIP', price: '£12.99/mo', features: ['Filter by gender', 'Filter by country', 'VIP badge on profile'], borderColor: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.08)', labelColor: '#60A5FA', checkColor: '#3B82F6' },`
);
// Basic card: already blue-ish but normalise
c = c.replace(
  `{ tier: 'Basic', price: '£6.99/mo', features: ['Filter by gender', 'Basic badge on profile'], borderColor: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.08)', labelColor: '#3b82f6', checkColor: '#3b82f6' },`,
  `{ tier: 'Basic', price: '£6.99/mo', features: ['Filter by gender', 'Basic badge on profile'], borderColor: 'rgba(59,130,246,0.2)', bg: 'rgba(59,130,246,0.06)', labelColor: '#3B82F6', checkColor: '#3B82F6' },`
);
// Membership "filters" text gradient
c = c.replace(
  `background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`,
  `background: 'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`
);
// Membership CTA button
c = c.replace(
  `background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)',\n                  boxShadow: '0 0 20px rgba(37,99,235,0.28), 0 4px 16px rgba(0,0,0,0.3)',`,
  `background: 'linear-gradient(135deg, #1d4ed8 0%, #3B82F6 100%)',\n                  boxShadow: '0 0 20px rgba(59,130,246,0.28), 0 4px 16px rgba(0,0,0,0.3)',`
);
// Membership section container
c = c.replace(
  `background: 'linear-gradient(160deg, rgba(47,107,255,0.07) 0%, rgba(5,8,22,0) 100%)', border: '1px solid rgba(80,140,255,0.14)'`,
  `background: 'rgba(6,11,20,0.5)', border: '1px solid rgba(59,130,246,0.12)'`
);
// Membership desc text
c = c.replace(
  `<p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280' }}>\n                Free gets you started. Membership gets you exactly who you want to meet — filter by gender, country, and more.\n              </p>`,
  `<p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>\n                Free gets you started. Membership gets you exactly who you want to meet — filter by gender, country, and more.\n              </p>`
);

// ── CREATOR MONETIZATION — full amber → blue conversion ──
// Section container
c = c.replace(
  `style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid rgba(245,158,11,0.14)' }}`,
  `style={{ background: 'rgba(6,11,20,0.5)', border: '1px solid rgba(59,130,246,0.12)' }}`
);
// "For Creators" badge
c = c.replace(
  `style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}`,
  `style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)' }}`
);
c = c.replace(
  `<DollarSign size={12} style={{ color: '#f59e0b' }} />\n                  <span className="text-[11px] font-black tracking-[0.1em] uppercase" style={{ color: '#f59e0b' }}>For Creators</span>`,
  `<DollarSign size={12} style={{ color: '#60A5FA' }} />\n                  <span className="text-[11px] font-black tracking-[0.1em] uppercase" style={{ color: '#60A5FA' }}>For Creators</span>`
);
// "Keep 70%." gradient
c = c.replace(
  `background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`,
  `background: 'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`
);
// Creator desc
c = c.replace(
  `<p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280' }}>\n                  Turn your conversations into income. Viewers send gifts, you earn real money — no middlemen taking the bulk of your earnings.\n                </p>`,
  `<p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>\n                  Turn your conversations into income. Viewers send gifts, you earn real money — no middlemen taking the bulk of your earnings.\n                </p>`
);
// "Start Earning" button
c = c.replace(
  `style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}`,
  `style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', color: '#60A5FA' }}`
);
// Stats grid colors
c = c.replace(
  `{ label: '70%', sub: 'Creator cut', color: '#f59e0b' },\n                  { label: 'Live', sub: 'Real-time gifts', color: '#7AACFF' },\n                  { label: '150+', sub: 'Countries', color: '#10b981' },\n                  { label: 'Free', sub: 'To start', color: '#38bdf8' },`,
  `{ label: '70%', sub: 'Creator cut', color: '#60A5FA' },\n                  { label: 'Live', sub: 'Real-time gifts', color: '#3B82F6' },\n                  { label: '150+', sub: 'Countries', color: '#93C5FD' },\n                  { label: 'Free', sub: 'To start', color: '#60A5FA' },`
);
// Stats card bg/border
c = c.replace(
  `style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>\n                    <p className="text-2xl font-black mb-1" style={{ color }}>{label}</p>`,
  `style={{ background: 'rgba(6,11,20,0.7)', border: '1px solid rgba(59,130,246,0.1)' }}>\n                    <p className="text-2xl font-black mb-1" style={{ color }}>{label}</p>`
);
// Stats sub text
c = c.replace(
  `<p className="text-[11px]" style={{ color: 'rgba(156,163,175,0.7)' }}>{sub}</p>`,
  `<p className="text-[11px]" style={{ color: 'rgba(148,163,184,0.5)' }}>{sub}</p>`
);

// ── TRUST & SAFETY ──
// Label: green → blue
c = c.replace(
  `<p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#10b981' }}>Trust & Safety</p>`,
  `<p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#60A5FA' }}>Trust & Safety</p>`
);
// "default" gradient: green→blue → pure blue
c = c.replace(
  `background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`,
  `background: 'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`
);
// Safety cards: standardize all colors to blue family
c = c.replace(
  `{ icon: Shield, title: '100% Anonymous', desc: 'No account needed. No data stored. Your sessions vanish the moment you leave.', color: '#2563eb' },\n            { icon: Globe, title: 'Human Moderation', desc: 'Our moderation team reviews every report. Violations are acted on, not ignored.', color: '#3b82f6' },\n            { icon: Video, title: 'One-Tap Report', desc: 'Tap the flag icon during any chat to report instantly and anonymously.', color: '#10b981' },\n            { icon: Lock, title: 'Instant Bans', desc: 'Verified rule-breakers are suspended immediately — no second chances for serious violations.', color: '#0ea5e9' },`,
  `{ icon: Shield, title: '100% Anonymous', desc: 'No account needed. No data stored. Your sessions vanish the moment you leave.', color: '#3B82F6' },\n            { icon: Globe, title: 'Human Moderation', desc: 'Our moderation team reviews every report. Violations are acted on, not ignored.', color: '#3B82F6' },\n            { icon: Video, title: 'One-Tap Report', desc: 'Tap the flag icon during any chat to report instantly and anonymously.', color: '#3B82F6' },\n            { icon: Lock, title: 'Instant Bans', desc: 'Verified rule-breakers are suspended immediately — no second chances for serious violations.', color: '#3B82F6' },`
);
// Safety card bg/border — cleaner unified glass
c = c.replace(
  `style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}\n              initial={{ opacity: 0, y: 16 }}\n              whileInView={{ opacity: 1, y: 0 }}\n              viewport={{ once: true }}\n              transition={{ delay: i * 0.07, duration: 0.45 }}\n              whileHover={{ y: -3, borderColor: \`\${color}40\`, boxShadow: \`0 8px 28px \${color}18\` }}`,
  `style={{ background: 'rgba(6,11,20,0.6)', border: '1px solid rgba(59,130,246,0.1)' }}\n              initial={{ opacity: 0, y: 16 }}\n              whileInView={{ opacity: 1, y: 0 }}\n              viewport={{ once: true }}\n              transition={{ delay: i * 0.07, duration: 0.45 }}\n              whileHover={{ y: -3, borderColor: 'rgba(59,130,246,0.28)', boxShadow: '0 8px 28px rgba(59,130,246,0.1)' }}`
);
// Safety card icon uses dynamic color — unify
c = c.replace(
  `<div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: \`\${color}18\`, border: \`1px solid \${color}28\` }}>`,
  `<div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)' }}>`
);
// Safety card desc
c = c.replace(
  `<p className="text-[12px] leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>`,
  `<p className="text-[12px] leading-relaxed" style={{ color: 'rgba(148,163,184,0.7)' }}>{desc}</p>`
);

// ── FAQ SECTION ──
// Label: purple class → blue inline
c = c.replace(
  `<p className="text-[11px] font-black tracking-[0.2em] text-vybe-purple-light uppercase mb-3">\n              Got questions?\n            </p>`,
  `<p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#60A5FA' }}>\n              Got questions?\n            </p>`
);
// "Questions" span: purple → blue gradient
c = c.replace(
  `<span className="text-purple-gradient">Questions</span>`,
  `<span style={{ background: 'linear-gradient(120deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Questions</span>`
);
// FAQ open state: purple → blue
c = c.replace(
  `isOpen ? 'bg-vybe-purple/20 text-vybe-purple-light' : 'text-vybe-muted'`,
  `isOpen ? '' : ''`
);
c = c.replace(
  `style={!isOpen ? { background: 'rgba(255,255,255,0.05)' } : {}}`,
  `style={{ background: isOpen ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: isOpen ? '#60A5FA' : 'rgba(148,163,184,0.5)' }}`
);
// FAQ item open bg/border
c = c.replace(
  `isOpen ? 'linear-gradient(160deg,#0e0e1d 0%,#0b0b19 100%)' : 'rgba(255,255,255,0.03)'`,
  `isOpen ? 'rgba(6,11,24,0.8)' : 'rgba(6,11,20,0.4)'`
);
c = c.replace(
  `isOpen ? '1px solid rgba(27,98,245,0.3)' : '1px solid rgba(255,255,255,0.06)'`,
  `isOpen ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(59,130,246,0.08)'`
);
// FAQ answer text
c = c.replace(
  `<p className="px-5 pb-5 text-vybe-muted text-sm leading-relaxed">{item.a}</p>`,
  `<p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.65)' }}>{item.a}</p>`
);
// FAQ question text color when closed
c = c.replace(
  `className={\`font-semibold text-sm sm:text-[15px] transition-colors \${isOpen ? 'text-white' : 'text-gray-400'}\`}`,
  `className="font-semibold text-sm sm:text-[15px] transition-colors" style={{ color: isOpen ? 'white' : 'rgba(186,200,225,0.65)' }}`
);
// Fix: className with style conflict — need to remove the class that won't work with style
// The above already handles it via style prop override

// ── HOW IT WORKS label (already #7AACFF — normalise to #60A5FA) ──
c = c.split(`color: '#7AACFF'`).join(`color: '#60A5FA'`);

// ── Section background — all sections should sit on same deep navy ──
// Remove any lingering purple/random section backgrounds

// ── MOBILE: clean up inline colors in mobile section ──
// Mobile camera error colors
c = c.split(`color: 'rgba(96,165,250,0.6)'`).join(`color: 'rgba(96,165,250,0.55)'`);
// Mobile "Live" badge color
c = c.split(`color: '#93c5fd'`).join(`color: '#60A5FA'`);
// Mobile start button - replace any purple
c = c.split(`'rgba(124,58,237`).join(`'rgba(59,130,246`);
c = c.split(`#7c3aed`).join(`#3B82F6`);
c = c.split(`#6d28d9`).join(`#2563eb`);
c = c.split(`#8b5cf6`).join(`#60A5FA`);
// Generic purple color values
c = c.split(`rgba(139,92,246`).join(`rgba(59,130,246`);
c = c.split(`rgba(124,58,237`).join(`rgba(59,130,246`);
c = c.split(`rgba(109,40,217`).join(`rgba(59,130,246`);

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('MainPage themed: OK');

// ─── NAVBAR ────────────────────────────────────────────────────────────────
let nb = fs.readFileSync('frontend/src/components/Navbar.jsx', 'utf8');
// Remove any lingering purple from navbar
nb = nb.split(`text-vybe-purple`).join(`text-blue-400`);
nb = nb.split(`bg-vybe-purple`).join(`bg-blue-500`);
nb = nb.split(`vybe-purple`).join(`blue-500`);
// Notification badge
nb = nb.replace(
  `className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-vybe-purple rounded-full`,
  `className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-500 rounded-full`
);
// Friend request badge
nb = nb.replace(
  `className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-[9px]`,
  `className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-[9px]`
);
fs.writeFileSync('frontend/src/components/Navbar.jsx', nb, 'utf8');
console.log('Navbar themed: OK');

// ─── FOOTER ────────────────────────────────────────────────────────────────
const footerPath = 'frontend/src/components/Footer.jsx';
if (fs.existsSync(footerPath)) {
  let ft = fs.readFileSync(footerPath, 'utf8');
  ft = ft.split(`vybe-purple`).join(`blue-500`);
  ft = ft.split(`#7c3aed`).join(`#3B82F6`);
  ft = ft.split(`#6d28d9`).join(`#2563eb`);
  ft = ft.split(`rgba(124,58,237`).join(`rgba(59,130,246`);
  ft = ft.split(`rgba(139,92,246`).join(`rgba(59,130,246`);
  fs.writeFileSync(footerPath, ft, 'utf8');
  console.log('Footer themed: OK');
}

console.log('\nAll done!');
