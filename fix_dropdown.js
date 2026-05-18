const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// ── 1. Replace the countryDrop useEffect
// Old: only calculates position when dropdown opens
// New: calculates position + adds scroll/resize listener that closes dropdown
const OLD_EFFECT = `  useEffect(() => {
    if (showCountryDrop && countryBtnRef.current) {
      const r = countryBtnRef.current.getBoundingClientRect()
      setCountryDropPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, r.left), width: Math.max(r.width, 260) })
    }
  }, [showCountryDrop])`;

const NEW_EFFECT = `  useEffect(() => {
    if (!showCountryDrop || !countryBtnRef.current) return
    const calcPos = () => {
      const r = countryBtnRef.current?.getBoundingClientRect()
      if (!r) return
      setCountryDropPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, r.left), width: Math.max(r.width, 280) })
    }
    calcPos()
    const close = () => setShowCountryDrop(false)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    window.addEventListener('resize', close, { passive: true })
    return () => {
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [showCountryDrop])`;

if (c.includes(OLD_EFFECT)) {
  c = c.replace(OLD_EFFECT, NEW_EFFECT);
  console.log('useEffect updated: OK');
} else {
  console.error('useEffect old string not found — check CRLF');
  // try CRLF version
  const CRLFOld = OLD_EFFECT.split('\n').join('\r\n');
  if (c.includes(CRLFOld)) {
    c = c.replace(CRLFOld, NEW_EFFECT);
    console.log('useEffect updated (CRLF): OK');
  } else {
    console.error('CRLF version also not found');
  }
}

// ── 2. Replace the dropdown portal with a premium redesigned version
const OLD_PORTAL = `        {/* Country dropdown portal */}
        {showCountryDrop && user?.isVip && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                bottom: countryDropPos.bottom,
                left: countryDropPos.left,
                width: countryDropPos.width,
                zIndex: 9999,
                background: '#0c0c1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  autoFocus
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search country…"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', outline: 'none', color: 'white', fontSize: '12px', padding: '10px 12px', borderRadius: 8 }}
                  className="placeholder-[rgba(120,120,140,0.5)]"
                />
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                {!countrySearch && (
                  <button
                    onClick={() => { setFilterCountry(''); setShowCountryDrop(false); setCountrySearch('') }}
                    className="w-full text-left text-xs"
                    style={{ padding: '8px 12px', color: 'rgba(160,160,180,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(160,160,180,0.6)' }}
                  >
                     Any country
                  </button>
                )}
                {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setFilterCountry(c); setShowCountryDrop(false); setCountrySearch('') }}
                    className="w-full text-left text-xs"
                    style={{ padding: '8px 12px', color: 'rgba(200,200,220,0.75)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(200,200,220,0.75)' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}`;

const NEW_PORTAL = `        {/* Country dropdown portal — closes on scroll, anchored via fixed+recalc */}
        {showCountryDrop && createPortal(
          <AnimatePresence>
            {showCountryDrop && (
              <motion.div
                key="country-drop"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  bottom: countryDropPos.bottom,
                  left: countryDropPos.left,
                  width: countryDropPos.width,
                  zIndex: 99999,
                  background: 'rgba(8,12,28,0.97)',
                  backdropFilter: 'blur(24px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                  border: '1px solid rgba(80,140,255,0.18)',
                  borderRadius: 16,
                  boxShadow: '0 0 0 1px rgba(80,140,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(47,107,255,0.08)',
                  overflow: 'hidden',
                  transformOrigin: 'bottom center',
                }}
              >
                {/* Search */}
                <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid rgba(80,140,255,0.1)' }}>
                  <input
                    autoFocus
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search country…"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(80,140,255,0.14)',
                      outline: 'none', color: 'white', fontSize: '13px', padding: '8px 12px', borderRadius: 10,
                      letterSpacing: '-0.01em',
                    }}
                    className="placeholder-[rgba(100,120,180,0.4)]"
                  />
                </div>

                {/* Options */}
                <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                  {!countrySearch && (
                    <button
                      onClick={() => { setFilterCountry(''); setShowCountryDrop(false); setCountrySearch('') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(130,160,255,0.6)',
                        display: 'flex', alignItems: 'center', gap: 8, transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(47,107,255,0.12)'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(130,160,255,0.6)' }}
                    >
                      <Globe size={12} style={{ flexShrink: 0 }} />
                      Any country
                    </button>
                  )}
                  {COUNTRIES.filter(cc => cc.toLowerCase().includes(countrySearch.toLowerCase())).map((cc) => (
                    <button
                      key={cc}
                      onClick={() => { setFilterCountry(cc); setShowCountryDrop(false); setCountrySearch('') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        color: filterCountry === cc ? 'white' : 'rgba(200,215,255,0.65)',
                        fontWeight: filterCountry === cc ? 700 : 400,
                        transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(47,107,255,0.12)'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = filterCountry === cc ? 'white' : 'rgba(200,215,255,0.65)';
                      }}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}`;

if (c.includes(OLD_PORTAL)) {
  c = c.replace(OLD_PORTAL, NEW_PORTAL);
  console.log('Portal replaced: OK');
} else {
  console.error('Portal old string not found');
}

fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('Done!');
