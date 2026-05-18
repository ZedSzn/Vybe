const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// Find the portal by markers
const startMarker = '{/* Country dropdown portal */}';
const endMarker = '        {/* Start Without Camera — ghost secondary */}';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx < 0 || endIdx < 0) {
  console.error('Markers not found. startIdx:', startIdx, 'endIdx:', endIdx);
  // try alternate end marker
  const alt = c.indexOf('Start Without Camera');
  console.log('Alt end marker at:', alt);
  process.exit(1);
}

// Cut out the old portal block and replace
const before = c.slice(0, startIdx);
const after = c.slice(endIdx);

const newPortal = `{/* Country dropdown portal — closes on scroll, anchored */}
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
                <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid rgba(80,140,255,0.1)' }}>
                  <input
                    autoFocus
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(80,140,255,0.14)',
                      outline: 'none', color: 'white', fontSize: '13px', padding: '8px 12px', borderRadius: 10,
                      letterSpacing: '-0.01em',
                    }}
                    className="placeholder-[rgba(100,120,180,0.4)]"
                  />
                </div>
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
        )}

        `;

c = before + newPortal + after;
fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('Portal replaced: OK');
console.log('Has globe import:', c.includes("Globe,") ? 'OK' : 'check imports');
console.log('Done!');
