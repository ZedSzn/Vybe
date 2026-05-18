const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// PALETTE
// bg:      #050816
// card:    rgba(10,18,40,0.65)
// border:  rgba(80,140,255,0.18)
// primary: #2F6BFF
// hover:   #4D8DFF
// glow:    rgba(47,107,255,0.18)
// ═══════════════════════════════════════════════════════════════

// ─── 1. NAVBAR ────────────────────────────────────────────────
let navbar = fs.readFileSync('frontend/src/components/Navbar.jsx', 'utf8');

// Background and blur
navbar = navbar.replace(
  `background: '#0a0a0f',\n        backdropFilter: 'none',`,
  `background: '#050816',\n        backdropFilter: 'blur(20px) saturate(1.6)',\n        borderBottom: '1px solid rgba(80,140,255,0.07)',`
);

// Buy Coins button gradient — remove purple
navbar = navbar.replace(
  `background: 'linear-gradient(135deg,#1b62f5,#4b88f7)'`,
  `background: 'linear-gradient(135deg,#2F6BFF,#4D8DFF)'`
);
// signup button
navbar = navbar.replace(
  `background: 'linear-gradient(135deg,#2065f5,#7c3aed)', boxShadow: '0 0 16px rgba(124,58,237,0.35)'`,
  `background: 'linear-gradient(135deg,#2F6BFF,#4D8DFF)', boxShadow: '0 0 16px rgba(47,107,255,0.3)'`
);

fs.writeFileSync('frontend/src/components/Navbar.jsx', navbar, 'utf8');
console.log('Navbar updated');

// ─── 2. MAINPAGE ──────────────────────────────────────────────
let c = fs.readFileSync('frontend/src/pages/MainPage.jsx', 'utf8');

// 2a. Root background
c = c.replace(`style={{ background: '#0a0a0f' }}`, `style={{ background: '#050816' }}`);

// 2b. Replace below-fold cyan/teal references
// HOW IT WORKS card colors
c = c.replace(
  `{ num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#2563eb' },\n            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#0ea5e9' },\n            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: '#38bdf8' },`,
  `{ num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#2F6BFF' },\n            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#4D8DFF' },\n            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: '#7AACFF' },`
);
// HOW IT WORKS heading gradient
c = c.replace(
  `background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 55%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`,
  `background: 'linear-gradient(135deg, #2F6BFF 0%, #4D8DFF 55%, #7AACFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'`
);
// #60a5fa → #7AACFF (light label text)
c = c.split(`color: '#60a5fa'`).join(`color: '#7AACFF'`);
// Membership section border/gradient
c = c.replace(
  `background: 'linear-gradient(160deg, rgba(37,99,235,0.08) 0%, rgba(10,10,20,0) 100%)', border: '1px solid rgba(37,99,235,0.15)'`,
  `background: 'linear-gradient(160deg, rgba(47,107,255,0.07) 0%, rgba(5,8,22,0) 100%)', border: '1px solid rgba(80,140,255,0.14)'`
);
// Membership CTA gradient (purple → blue)
c = c.replace(
  `background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)'`,
  `background: 'linear-gradient(140deg, #1a3a8f 0%, #2F6BFF 55%, #4D8DFF 100%)'`
);

// 2c. Replace the entire desktop section
const desktopIdx   = c.indexOf('Desktop Layout');
const howWorksIdx  = c.indexOf('HOW IT WORKS');
if (desktopIdx < 0 || howWorksIdx < 0) { console.error('Markers not found'); process.exit(1); }
const openBrace    = c.lastIndexOf('{', desktopIdx);
const lineStart    = c.lastIndexOf('\n', openBrace - 1);
const howBrace     = c.lastIndexOf('{', howWorksIdx);
const howLineStart = c.lastIndexOf('\n', howBrace - 1);

const newDesktop = `
      {/* ─── Desktop Hero ─────────────────────────────────────── */}
      <section
        className="hidden lg:flex flex-col relative z-10"
        style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#050816', overflow: 'hidden' }}>

        {/* ── Announcement strip ── */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(80,140,255,0.09)', background: 'rgba(5,8,22,0.6)' }}>
          <span className="px-2 py-0.5 rounded text-[10px] font-black text-white tracking-widest uppercase"
            style={{ background: '#2F6BFF', letterSpacing: '0.12em' }}>NEW</span>
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Earn coins by chatting, daily rewards &amp; more.
          </span>
          <button
            className="text-[13px] font-semibold"
            style={{ color: '#4D8DFF' }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn more &rarr;
          </button>
        </div>

        {/* ── Two-column area ── */}
        <div className="flex flex-1 min-h-0">

          {/* ────────── LEFT: Controls ────────── */}
          <div
            className="flex flex-col justify-center"
            style={{ width: '46%', flexShrink: 0, padding: '0 52px 0 60px' }}>

            {/* Live badge */}
            <motion.div
              className="inline-flex items-center gap-2.5 mb-8"
              style={{ width: 'fit-content', padding: '7px 16px', borderRadius: 999, background: 'rgba(47,107,255,0.08)', border: '1px solid rgba(80,140,255,0.2)' }}>
              <motion.span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#2F6BFF' }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.5)' }}>
                LIVE &middot; RANDOM &middot; REAL
              </span>
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(38px,3.6vw,58px)', lineHeight: 1.01, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 16 }}>
              <span style={{ color: '#ffffff', display: 'block' }}>Meet someone real.</span>
              <span style={{ display: 'block', background: 'linear-gradient(120deg,#2F6BFF 0%,#7AACFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Share authentic vibes.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.32)', maxWidth: 320, marginBottom: 28 }}>
              Random video chat with real people from around the world. Instantly.
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
              <div className="flex items-center">
                {AVATARS.map((n, i) => (
                  <img key={n} src={"https://i.pravatar.cc/48?img=" + n} alt=""
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #050816', marginLeft: i === 0 ? 0 : -9, position: 'relative', zIndex: 10 - i, flexShrink: 0 }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, display: 'block' }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  {onlineCount >= 20 ? onlineCount.toLocaleString() : '12,846'} people online now
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>

              {/* Primary */}
              <motion.button
                onClick={startVybing}
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: '100%', height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'linear-gradient(135deg, #2056e8 0%, #2F6BFF 50%, #4D8DFF 100%)',
                  boxShadow: '0 4px 24px rgba(47,107,255,0.35), 0 1px 0 rgba(255,255,255,0.12) inset',
                  border: 'none', color: 'white', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', cursor: 'pointer',
                }}>
                <Video size={17} />
                Start Video Chat
              </motion.button>

              {/* Secondary */}
              <motion.button
                onClick={() => {
                  streamRef.current?.getTracks().forEach(t => t.stop());
                  streamRef.current = null; setCameraOn(false);
                  navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } });
                }}
                whileHover={{ scale: 1.012, borderColor: 'rgba(80,140,255,0.28)' }}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: '100%', height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'rgba(10,18,40,0.55)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(80,140,255,0.18)',
                  color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer',
                }}>
                <VideoOff size={16} />
                Start Without Camera
              </motion.button>

            </div>

            {/* ── Filter bar ── */}
            <div style={{
              borderRadius: 18, padding: '12px 16px',
              background: 'rgba(10,18,40,0.65)', backdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(80,140,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(80,140,255,0.05) inset',
            }}>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>

                {/* GENDER */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginBottom: 8 }}>GENDER</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['Both', 'both'], ['Male', 'male'], ['Female', 'female']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => handleGender(val)}
                        whileTap={{ scale: 0.94 }}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                          ...(filterGender === val
                            ? { background: '#2F6BFF', color: 'white', boxShadow: '0 2px 10px rgba(47,107,255,0.4)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.38)' }),
                        }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, background: 'rgba(80,140,255,0.1)', margin: '0 14px', flexShrink: 0 }} />

                {/* COUNTRY */}
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginBottom: 8 }}>COUNTRY</p>
                  <motion.button
                    ref={countryBtnRef}
                    onClick={handleCountryClick}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: 'none',
                      color: filterCountry ? 'white' : 'rgba(255,255,255,0.38)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                    {user?.isVip
                      ? <Globe size={12} style={{ color: 'rgba(80,140,255,0.6)', flexShrink: 0 }} />
                      : <Lock size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
                    {filterCountry || 'Any country'}
                    <ChevronDown size={10} style={{ color: 'rgba(255,255,255,0.2)', transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
                  </motion.button>
                </div>

                {/* Divider */}
                <div style={{ width: 1, background: 'rgba(80,140,255,0.1)', margin: '0 14px', flexShrink: 0 }} />

                {/* MODE */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginBottom: 8 }}>MODE</p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['Solo', 'solo'], ['Duo', 'squad'], ['Private', 'private']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => setMode(val)}
                        whileTap={{ scale: 0.94 }}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                          ...(mode === val
                            ? { background: '#2F6BFF', color: 'white', boxShadow: '0 2px 10px rgba(47,107,255,0.4)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.38)' }),
                        }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <motion.button
                  onClick={() => setShowAdvanced(v => !v)}
                  whileTap={{ scale: 0.9 }}
                  style={{ alignSelf: 'flex-end', marginBottom: 2, marginLeft: 10, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <SlidersHorizontal size={16} />
                </motion.button>

              </div>
            </div>

          </div>

          {/* Subtle column divider */}
          <div style={{ width: 1, background: 'rgba(80,140,255,0.07)', flexShrink: 0 }} />

          {/* ────────── RIGHT: Camera panel ────────── */}
          <div className="flex-1 relative overflow-hidden" style={{ background: '#050816' }}>

            {/* Cinematic ambient layers */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 35%, rgba(47,107,255,0.1) 0%, transparent 65%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 20% 80%, rgba(20,50,150,0.08) 0%, transparent 60%)' }} />
            {/* Subtle grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(80,140,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(80,140,255,0.025) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }} />
            {/* Edge vignette */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(5,8,22,0.7) 100%)' }} />

            {/* Live video feed */}
            <video ref={videoRefDesktop} autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center top', opacity: cameraOn && !cameraErr ? 1 : 0, transition: 'opacity 0.5s ease' }} />

            {/* Idle state — no photo, cinematic dark */}
            {(!cameraOn || cameraErr) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
                {/* Pulsing ring */}
                <motion.div
                  className="relative flex items-center justify-center"
                  style={{ marginBottom: 24 }}>
                  <motion.div
                    style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', border: '1px solid rgba(47,107,255,0.25)' }}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.15, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity }} />
                  <motion.div
                    style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', border: '1px solid rgba(47,107,255,0.18)' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.08, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.3 }} />
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,18,40,0.8)', border: '1px solid rgba(80,140,255,0.2)',
                    backdropFilter: 'blur(12px)',
                  }}>
                    {cameraErr
                      ? <VideoOff size={24} style={{ color: 'rgba(80,140,255,0.4)' }} />
                      : <Camera size={24} style={{ color: 'rgba(80,140,255,0.5)' }} />
                    }
                  </div>
                </motion.div>

                <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {cameraErr ? 'Camera access needed' : 'Your video preview'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginBottom: 28, textAlign: 'center', maxWidth: 180, lineHeight: 1.5 }}>
                  {cameraErr ? (cameraErrMsg || 'Allow camera access in browser settings') : 'Only you can see this preview'}
                </p>

                <motion.button
                  onClick={enableCamera}
                  whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(47,107,255,0.3)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 99,
                    background: 'rgba(10,18,40,0.75)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(80,140,255,0.3)',
                    color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 0 0 1px rgba(47,107,255,0.06) inset',
                  }}>
                  {cameraErr ? <VideoOff size={14} /> : <Camera size={14} />}
                  {cameraErr ? 'Try Again' : 'Enable Camera'}
                </motion.button>
              </div>
            )}

            {/* Top-left camera controls (when live) */}
            {cameraOn && !cameraErr && (
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
                  style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,8,22,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(80,140,255,0.18)', cursor: 'pointer' }}>
                  <Camera size={15} style={{ color: 'rgba(255,255,255,0.65)' }} />
                </motion.button>
              </div>
            )}

          </div>

        </div>

      </section>

      `;

c = c.slice(0, lineStart + 1) + newDesktop + c.slice(howLineStart + 1);
fs.writeFileSync('frontend/src/pages/MainPage.jsx', c, 'utf8');
console.log('MainPage desktop section replaced');
console.log('Done!');
