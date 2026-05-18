const fs = require('fs');

// ─── NAVBAR: bigger logo ──────────────────────────────────────────────────
let navbar = fs.readFileSync('frontend/src/components/Navbar.jsx', 'utf8');
navbar = navbar
  .replace(/text-\[27px\] font-extrabold tracking-\[0\.1em\].*?VY/gs, m =>
    m.replace('text-[27px]', 'text-[32px]').replace('tracking-[0.1em]', 'tracking-[0.08em]')
  )
  .replace(/text-\[27px\] font-extrabold tracking-\[0\.1em\] text-white.*?VYBE/gs, m =>
    m.replace('text-[27px]', 'text-[32px]')
  );
// simpler targeted replace
navbar = navbar.replace(
  `className="text-[27px] font-extrabold tracking-[0.1em]"`,
  `className="text-[32px] font-extrabold tracking-[0.06em]"`
);
navbar = navbar.replace(
  `className="text-[27px] font-extrabold tracking-[0.1em] text-white"`,
  `className="text-[32px] font-extrabold tracking-[0.06em] text-white"`
);
fs.writeFileSync('frontend/src/components/Navbar.jsx', navbar, 'utf8');
console.log('Navbar logo updated');

// ─── MAINPAGE ────────────────────────────────────────────────────────────
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// 1. Camera section height — make section cover full viewport height and overlay navbar
// Change: height calc(100vh - 64px) + marginTop 64px → height 100vh + position relative top-0
// Actually keep marginTop but ensure camera panel fills fully
// Change: height: 'calc(100vh - 64px)' to height: '100vh', marginTop stays but let it shift section
// Better: use top-0 absolute positioning for section, or simply extend height by navbar height
c = c.replace(
  `style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#0a0a0f', overflow: 'hidden' }}`,
  `style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#0a0a0f', overflow: 'hidden', position: 'relative' }}`
);

// 2. Camera panel — ensure it fills full height of flex container + no rounding
c = c.replace(
  `<div className="relative flex flex-col" style={{ width: '55%', background: '#0d0d18' }}>`,
  `<div className="relative flex flex-col" style={{ width: '55%', background: '#0d0d18', height: '100%', minHeight: 0 }}>`
);

// 3. Move matching count to bottom-left (not centered)
c = c.replace(
  `<div className="absolute bottom-5 left-0 right-0 flex justify-center z-20 pointer-events-none">`,
  `<div className="absolute bottom-5 left-5 z-20 pointer-events-none">`
);

// 4. Right grid panel: remove top padding from disclaimer, start flush
c = c.replace(
  `<p className="text-right text-[10px] px-3 pt-2.5 pb-1"\n              style={{ color: 'rgba(255,255,255,0.12)' }}>\n              All images are of models used for illustrative purposes.\n            </p>`,
  `<p className="text-right text-[10px] px-3 pt-1 pb-0.5"\n              style={{ color: 'rgba(255,255,255,0.08)', fontSize: '9px' }}>\n              Illustrative images\n            </p>`
);

// 5. Grid: remove gap at top, tighter padding
c = c.replace(
  `<div className="grid grid-cols-3 gap-1.5 px-2 pb-2">`,
  `<div className="grid grid-cols-3 gap-1 px-1 pb-1">`
);

// 6. Cards: rounded-[18px] → rounded-xl (12px), keep equal height
c = c.replace(
  `className="relative rounded-[18px] overflow-hidden cursor-pointer group"`,
  `className="relative rounded-xl overflow-hidden cursor-pointer group"`
);

// 7. Card text: bigger name + bold country
c = c.replace(
  `<p className="text-white font-bold text-[13px] leading-tight">
                        {u.name}<span className="font-normal" style={{ color: 'rgba(255,255,255,0.52)' }}>, {u.age}</span>
                      </p>
                      <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.country}</span>`,
  `<p className="text-white font-bold text-[15px] leading-tight">
                        {u.name}<span className="font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>, {u.age}</span>
                      </p>
                      <span className="text-[12px] font-black tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>{u.country}</span>`
);

// 8. Card gradient overlay: stronger bottom gradient for text readability
c = c.replace(
  `style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 52%, transparent 100%)' }}`,
  `style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.1) 65%, transparent 100%)' }}`
);

// 9. Card bottom info: more padding
c = c.replace(
  `<div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">`,
  `<div className="absolute bottom-0 left-0 right-0 px-3 pb-3">`
);

// 10. ONLINE badge: slightly bigger, brighter green
c = c.replace(
  `<div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"\n                      style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-[8.5px] font-bold text-white tracking-widest uppercase">Online</span>`,
  `<div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"\n                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
                      <span className="text-[9px] font-black text-white tracking-widest uppercase">ONLINE</span>`
);

// 11. Bottom bar: taller + more premium padding on pills
c = c.replace(
  `style={{ height: '72px', background: 'rgba(10,10,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', zIndex: 30 }}`,
  `style={{ height: '80px', background: 'rgba(8,8,14,0.96)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(32px) saturate(1.5)', WebkitBackdropFilter: 'blur(32px) saturate(1.5)', zIndex: 30 }}`
);

// 12. Gender pill: more padding
c = c.replace(
  `onClick={() => setShowGenderPop(v => !v)}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>`,
  `onClick={() => setShowGenderPop(v => !v)}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>`
);

// 13. Country pill: more padding
c = c.replace(
  `onClick={handleCountryClick}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>`,
  `onClick={handleCountryClick}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>`
);

// 14. Start button: taller, more prominent
c = c.replace(
  `style={{
              height: '48px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              boxShadow: '0 0 18px rgba(59,130,246,0.2)',
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}>`,
  `style={{
              height: '52px',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
              boxShadow: '0 0 24px rgba(59,130,246,0.28), 0 4px 16px rgba(0,0,0,0.4)',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}>`
);

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('MainPage polished');
console.log('Done!');
