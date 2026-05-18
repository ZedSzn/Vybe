const fs = require('fs');

// ─── 1. NAVBAR: blend into page background ───────────────────────────────────
const navbarFile = 'frontend/src/components/Navbar.jsx';
let navbar = fs.readFileSync(navbarFile, 'utf8');
navbar = navbar.replace(
  `        background: 'rgba(8, 8, 22, 0.97)',\n        backdropFilter: 'blur(36px) saturate(1.8)',\n        borderBottom: '1px solid rgba(255,255,255,0.12)',\n        boxShadow: '0 1px 32px rgba(0,0,0,0.6)',`,
  `        background: '#0a0a0f',\n        backdropFilter: 'none',`
);
fs.writeFileSync(navbarFile, navbar, 'utf8');
console.log('Navbar updated');

// ─── 2. MAINPAGE ─────────────────────────────────────────────────────────────
const mainFile = 'frontend/src/pages/MainPage.jsx';
let c = fs.readFileSync(mainFile, 'utf8');

// 2a. Update GRID_USERS with online field + more users
const newGridUsers = `const GRID_USERS = [
  { name: 'Sofia',    age: 23, country: 'IT', photo: 'https://randomuser.me/api/portraits/women/44.jpg', online: true  },
  { name: 'Ava',      age: 25, country: 'US', photo: 'https://randomuser.me/api/portraits/women/33.jpg', online: true  },
  { name: 'Ella',     age: 25, country: 'GB', photo: 'https://randomuser.me/api/portraits/women/22.jpg', online: false },
  { name: 'John',     age: 28, country: 'CA', photo: 'https://randomuser.me/api/portraits/men/32.jpg',   online: true  },
  { name: 'Isabella', age: 24, country: 'US', photo: 'https://randomuser.me/api/portraits/women/55.jpg', online: true  },
  { name: 'Zoey',     age: 22, country: 'AU', photo: 'https://randomuser.me/api/portraits/women/66.jpg', online: false },
  { name: 'Lucas',    age: 27, country: 'FR', photo: 'https://randomuser.me/api/portraits/men/44.jpg',   online: true  },
  { name: 'Emma',     age: 26, country: 'DE', photo: 'https://randomuser.me/api/portraits/women/11.jpg', online: false },
  { name: 'Marco',    age: 29, country: 'BR', photo: 'https://randomuser.me/api/portraits/men/55.jpg',   online: true  },
  { name: 'Mia',      age: 24, country: 'NL', photo: 'https://randomuser.me/api/portraits/women/77.jpg', online: true  },
  { name: 'Alex',     age: 26, country: 'ES', photo: 'https://randomuser.me/api/portraits/men/66.jpg',   online: false },
  { name: 'Chloe',    age: 22, country: 'KR', photo: 'https://randomuser.me/api/portraits/women/88.jpg', online: true  },
]`;
c = c.replace(/const GRID_USERS = \[[^\]]*\]/, newGridUsers);

// 2b. Add showGenderPop state (after showAdvanced)
c = c.replace(
  "const [showAdvanced,    setShowAdvanced]    = useState(false)",
  "const [showAdvanced,    setShowAdvanced]    = useState(false)\n  const [showGenderPop,   setShowGenderPop]   = useState(false)"
);

// 2c. Add close-on-outside-click effect for gender popup (after countryDrop useEffect)
const genderPopEffect = `
  useEffect(() => {
    if (!showGenderPop) return
    const handler = () => setShowGenderPop(false)
    const timer = setTimeout(() => document.addEventListener('click', handler), 60)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [showGenderPop])
`;
c = c.replace(
  "  useEffect(() => {\n    if (showCountryDrop && countryBtnRef.current) {",
  genderPopEffect + "\n  useEffect(() => {\n    if (showCountryDrop && countryBtnRef.current) {"
);

// 2d. Remove the announcement banner entirely
const earnBannerStart = c.indexOf('{/* ══════════════ EARN BANNER');
const mobileStart = c.indexOf('{/* ══════════════ MOBILE LAYOUT');
if (earnBannerStart >= 0 && mobileStart >= 0) {
  // find the newline just before the earn banner comment
  const cutStart = c.lastIndexOf('\n', earnBannerStart);
  c = c.slice(0, cutStart) + '\n' + c.slice(mobileStart - 6); // keep 6 spaces indent
}

// 2e. Replace the desktop section
const desktopStart = c.indexOf('{/* ══════════════ DESKTOP LAYOUT');
const howItWorksStart = c.indexOf('{/* ══════════════ HOW IT WORKS');
if (desktopStart < 0 || howItWorksStart < 0) {
  console.error('Could not find desktop section markers!');
  process.exit(1);
}

// cut from just before the desktop section comment to just before HOW IT WORKS
const beforeDesktop = c.lastIndexOf('\n', desktopStart);

const newDesktopSection = `
      {/* ══════════════ DESKTOP LAYOUT — Azar-style ══════════════ */}
      <section
        className="hidden lg:flex flex-col relative z-10"
        style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#0a0a0f', overflow: 'hidden' }}>

        {/* ── Main 2-column area ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Camera panel (55%) */}
          <div className="relative flex flex-col" style={{ width: '55%', background: '#0d0d18' }}>

            {/* Live video feed */}
            <video ref={videoRefDesktop} autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center top', opacity: cameraOn && !cameraErr ? 1 : 0, transition: 'opacity 0.4s' }} />

            {/* Idle / error overlay */}
            {(!cameraOn || cameraErr) && (
              <div className="absolute inset-0">
                <img src="https://i.pravatar.cc/800?img=47" alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'blur(40px) saturate(1.2)', transform: 'scale(1.1)', opacity: 0.14 }} />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, rgba(13,13,24,0.82) 0%, rgba(13,13,24,0.95) 100%)' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-5"
                    style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }}>
                    <img src="https://i.pravatar.cc/128?img=47" alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: 'blur(5px) brightness(0.5)' }} />
                  </div>
                  <p className="font-semibold text-[15px] mb-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {cameraErr ? 'Camera access needed' : 'Enable your camera'}
                  </p>
                  <p className="text-[12px] mb-6 text-center"
                    style={{ color: 'rgba(255,255,255,0.3)', maxWidth: '190px' }}>
                    {cameraErr ? (cameraErrMsg || 'Allow camera in browser settings') : 'Only you can see your preview'}
                  </p>
                  <motion.button onClick={enableCamera}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold text-white"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}>
                    {cameraErr ? <VideoOff size={14} /> : <Camera size={14} />}
                    {cameraErr ? 'Try Again' : 'Enable Camera'}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Top-left icons */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Camera size={16} className="text-white/80" />
              </motion.button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <SlidersHorizontal size={16} className="text-white/80" />
              </motion.div>
            </div>

            {/* Vignette when live */}
            {cameraOn && !cameraErr && (
              <div className="absolute inset-0 pointer-events-none z-10"
                style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.28) 100%)' }} />
            )}

            {/* Matching count */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center z-20 pointer-events-none">
              <div className="flex items-center gap-2.5 px-5 py-2 rounded-full"
                style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <motion.span
                  className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }} />
                <span className="text-white font-semibold text-[14px]">
                  {onlineCount >= 20 ? onlineCount.toLocaleString() : '12,847'} are matching now!
                </span>
              </div>
            </div>

          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

          {/* RIGHT: Live users grid (45%) */}
          <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0f' }}>
            <p className="text-right text-[10px] px-3 pt-2.5 pb-1"
              style={{ color: 'rgba(255,255,255,0.12)' }}>
              All images are of models used for illustrative purposes.
            </p>
            <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
              {GRID_USERS.map((u) => (
                <div key={u.name}
                  className="relative rounded-[18px] overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: '2/3', background: '#111118' }}>
                  <img src={u.photo} alt={u.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 52%, transparent 100%)' }} />
                  {u.online && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-[8.5px] font-bold text-white tracking-widest uppercase">Online</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
                    <div className="flex items-end justify-between">
                      <p className="text-white font-bold text-[13px] leading-tight">
                        {u.name}<span className="font-normal" style={{ color: 'rgba(255,255,255,0.52)' }}>, {u.age}</span>
                      </p>
                      <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.country}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ══ BOTTOM CONTROL BAR ══ */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5"
          style={{ height: '72px', background: 'rgba(10,10,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', zIndex: 30 }}>

          {/* Gender pill */}
          <div className="relative flex-shrink-0">
            <motion.button
              onClick={() => setShowGenderPop(v => !v)}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <User size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
              <span className="text-[13px] font-semibold text-white whitespace-nowrap">
                {filterGender === 'both' ? 'Gender' : filterGender === 'male' ? 'Male' : 'Female'}
              </span>
              <ChevronDown size={11} style={{ color: 'rgba(255,255,255,0.3)', transition: 'transform 200ms', transform: showGenderPop ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>
            <AnimatePresence>
              {showGenderPop && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 overflow-hidden rounded-2xl z-50 min-w-[130px]"
                  style={{ background: '#141422', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
                  {[['Anyone', 'both'], ['Male', 'male'], ['Female', 'female']].map(([label, val]) => (
                    <button key={val}
                      onClick={() => { handleGender(val); setShowGenderPop(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center justify-between transition-colors hover:bg-white/5"
                      style={{ color: filterGender === val ? '#3b82f6' : 'rgba(255,255,255,0.72)' }}>
                      {label}
                      {filterGender === val && <Check size={12} style={{ color: '#3b82f6' }} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Country pill */}
          <div className="flex-shrink-0 relative">
            <motion.button
              ref={countryBtnRef}
              onClick={handleCountryClick}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {user?.isVip
                ? <Globe size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                : <Lock size={14} style={{ color: 'rgba(255,255,255,0.28)' }} />}
              <span className="text-[13px] font-semibold text-white whitespace-nowrap">
                {filterCountry || 'Country'}
              </span>
              <ChevronDown size={11} style={{ color: 'rgba(255,255,255,0.3)', transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>
          </div>

          {/* Start Video Chat */}
          <motion.button
            onClick={startVybing}
            whileHover={{ scale: 1.012, boxShadow: '0 0 28px rgba(37,99,235,0.38)' }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center gap-3.5 px-5 rounded-full text-white font-bold"
            style={{
              height: '48px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              boxShadow: '0 0 18px rgba(59,130,246,0.2)',
              fontSize: '15px',
              letterSpacing: '-0.01em',
            }}>
            <div className="flex items-center flex-shrink-0">
              {AVATARS.slice(0, 4).map((n, i) => (
                <img key={n} src={"https://i.pravatar.cc/48?img=" + n} alt=""
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ border: '2px solid #2563eb', marginLeft: i === 0 ? '0' : '-10px', position: 'relative', zIndex: 4 - i }} />
              ))}
            </div>
            <span>Start Video Chat</span>
          </motion.button>

          {/* No-cam */}
          <motion.button
            onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraOn(false); navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } }) }}
            whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
            style={{ color: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <VideoOff size={15} />
          </motion.button>

        </div>

      </section>

      `;

c = c.slice(0, beforeDesktop + 1) + newDesktopSection + c.slice(howItWorksStart);

fs.writeFileSync(mainFile, c, 'utf8');
console.log('MainPage updated');
console.log('Done!');
