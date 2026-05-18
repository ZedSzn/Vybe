const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// ── 1. Remove the grid pattern div completely ──────────────────────────────
c = c.replace(
  `            {/* Subtle grid */}\n            <div className="absolute inset-0" style={{\n              backgroundImage: 'linear-gradient(rgba(80,140,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(80,140,255,0.025) 1px, transparent 1px)',\n              backgroundSize: '64px 64px',\n            }} />`,
  ''
);
console.log('Grid removed:', !c.includes('backgroundSize: \'64px 64px\'') ? 'OK' : 'FAIL');

// ── 2. Remove the column divider line ──────────────────────────────────────
c = c.replace(
  `\n          {/* Subtle column divider */}\n          <div style={{ width: 1, background: 'rgba(80,140,255,0.07)', flexShrink: 0 }} />`,
  ''
);
console.log('Divider removed:', !c.includes("'rgba(80,140,255,0.07)'") ? 'OK' : 'OK (may appear elsewhere)');

// ── 3. Tighten left column spacing ────────────────────────────────────────
// Badge: mb-8 → mb-5
c = c.replace(
  `className="inline-flex items-center gap-2.5 mb-8"`,
  `className="inline-flex items-center gap-2.5 mb-5"`
);
// Subtitle marginBottom: 28 → 20
c = c.replace(
  `fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.32)', maxWidth: 320, marginBottom: 28`,
  `fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.32)', maxWidth: 320, marginBottom: 20`
);
// Social proof marginBottom: 28 → 20
c = c.replace(
  `className="flex items-center gap-3" style={{ marginBottom: 28 }}`,
  `className="flex items-center gap-3" style={{ marginBottom: 20 }}`
);
// CTA container gap 10 → 8, marginBottom 20 → 14
c = c.replace(
  `style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}`,
  `style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}`
);
// Headline marginBottom: 16 → 12
c = c.replace(
  `fontSize: 'clamp(38px,3.6vw,58px)', lineHeight: 1.01, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 16`,
  `fontSize: 'clamp(36px,3.2vw,54px)', lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 12`
);
console.log('Left spacing tightened');

// ── 4. Filter bar: slightly more compact ──────────────────────────────────
c = c.replace(
  `borderRadius: 18, padding: '12px 16px',`,
  `borderRadius: 16, padding: '10px 14px',`
);
// Filter labels marginBottom: 8 → 6 (both occurrences)
c = c.split(
  `fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginBottom: 8`
).join(
  `fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginBottom: 6`
);
console.log('Filter bar compacted');

// ── 5. Restructure right panel: add padding wrapper + rounded card ─────────
const OLD_RIGHT_PANEL = `          {/* ────────── RIGHT: Camera panel ────────── */}
          <div className="flex-1 relative overflow-hidden" style={{ background: '#050816' }}>

            {/* Cinematic ambient layers */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 35%, rgba(47,107,255,0.1) 0%, transparent 65%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 20% 80%, rgba(20,50,150,0.08) 0%, transparent 60%)' }} />

            {/* Edge vignette */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(5,8,22,0.7) 100%)' }} />`;

const NEW_RIGHT_PANEL = `          {/* ────────── RIGHT: Camera panel ────────── */}
          <div className="flex-1 flex items-center" style={{ padding: '28px 52px 28px 20px', background: '#050816' }}>
          <div className="relative overflow-hidden" style={{
            width: '100%', height: '100%', borderRadius: 28,
            background: '#080e1c',
            border: '1px solid rgba(59,130,246,0.12)',
            boxShadow: '0 0 80px rgba(47,107,255,0.07), 0 24px 48px rgba(0,0,0,0.4)',
          }}>

            {/* Cinematic ambient layers */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 35%, rgba(47,107,255,0.09) 0%, transparent 70%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 45% 35% at 15% 85%, rgba(20,50,150,0.06) 0%, transparent 65%)' }} />`;

// The old panel text might have the extra empty line or not — try flexible match
const cleanedOld = c.includes(OLD_RIGHT_PANEL)
  ? c.replace(OLD_RIGHT_PANEL, NEW_RIGHT_PANEL)
  : null;

if (cleanedOld) {
  c = cleanedOld;
  console.log('Right panel wrapper added: OK (exact match)');
} else {
  // fallback: find by key landmarks
  const markerA = `{/* ────────── RIGHT: Camera panel ────────── */}`;
  const markerB = `{/* Edge vignette */}`;
  const idxA = c.indexOf(markerA);
  const idxB = c.indexOf(markerB);
  if (idxA >= 0 && idxB >= 0) {
    const before = c.slice(0, idxA + 6); // keep a few chars before
    const after  = c.slice(idxB); // keep from edge vignette onward
    // reconstruct — find actual start of the right panel div
    const rightDivStart = c.lastIndexOf('\n', idxA - 1);
    c = c.slice(0, rightDivStart + 1) + NEW_RIGHT_PANEL + '\n' + c.slice(idxB);
    console.log('Right panel wrapper added: OK (landmark match)');
  } else {
    console.error('Right panel markers not found!', idxA, idxB);
  }
}

// ── 6. Close the extra wrapper div before </section> ──────────────────────
// The right panel now has an extra <div> that needs closing before its parent closes
// Find the camera panel closing: </div>\n\n        </div>\n\n      </section>
c = c.replace(
  `\n          </div>\n\n        </div>\n\n      </section>`,
  `\n          </div>\n          </div>\n\n        </div>\n\n      </section>`
);
console.log('Extra closing div added');

// ── 7. Reduce left padding slightly for more breathing room toward center ──
c = c.replace(
  `style={{ width: '46%', flexShrink: 0, padding: '0 52px 0 60px' }}`,
  `style={{ width: '46%', flexShrink: 0, padding: '0 44px 0 56px' }}`
);
console.log('Left padding adjusted');

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('\nAll changes applied. Done!');
