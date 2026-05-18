const fs = require('fs');

const mainFile = 'frontend/src/pages/MainPage.jsx';
let c = fs.readFileSync(mainFile, 'utf8');

// Find desktop section start and end
const desktopIdx   = c.indexOf('Desktop Layout');
const howWorksIdx  = c.indexOf('HOW IT WORKS');
if (desktopIdx < 0 || howWorksIdx < 0) { console.error('Markers not found'); process.exit(1); }

const openBrace   = c.lastIndexOf('{', desktopIdx);
const lineStart   = c.lastIndexOf('\n', openBrace - 1);
const howBrace    = c.lastIndexOf('{', howWorksIdx);
const howLineStart = c.lastIndexOf('\n', howBrace - 1);

const newSection = `
      {/* Desktop Layout — Hero */}
      <section
        className="hidden lg:flex flex-col relative z-10"
        style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#080810', overflow: 'hidden' }}>

        {/* Announcement banner */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black text-white tracking-wide"
            style={{ background: '#1d4ed8' }}>NEW</span>
          <DollarSign size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Earn coins by chatting, daily rewards &amp; more.
          </span>
          <button className="text-[13px] font-semibold flex items-center gap-1"
            style={{ color: '#60a5fa' }}
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn more &rarr;
          </button>
        </div>

        {/* Two-column main area */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT: Hero content */}
          <div className="flex flex-col justify-center px-12 xl:px-16 py-8"
            style={{ width: '46%', flexShrink: 0 }}>

            {/* LIVE badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
              <motion.span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#3b82f6' }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-[11px] font-black tracking-[0.2em]"
                style={{ color: 'rgba(255,255,255,0.6)' }}>LIVE &middot; RANDOM &middot; REAL</span>
            </div>

            {/* Headline */}
            <h1 className="font-black leading-[1.04] mb-3" style={{ fontSize: 'clamp(36px, 3.2vw, 52px)' }}>
              <span className="block text-white">Meet someone real.</span>
              <span className="block" style={{ color: '#3b82f6' }}>Share authentic vibes.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] leading-relaxed mb-7"
              style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '340px' }}>
              Random video chat with real people from around the world. Instantly.
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-3 mb-7">
              <div className="flex items-center">
                {AVATARS.map((n, i) => (
                  <img key={n} src={"https://i.pravatar.cc/48?img=" + n} alt=""
                    className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
                    style={{ border: '2px solid #080810', marginLeft: i === 0 ? 0 : -10, position: 'relative', zIndex: 10 - i }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }} />
                <span className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {onlineCount >= 20 ? onlineCount.toLocaleString() : '12,846'} people online now
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <motion.button
                onClick={startVybing}
                whileHover={{ scale: 1.015, boxShadow: '0 0 32px rgba(37,99,235,0.45)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-white font-black text-[15px]"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  boxShadow: '0 0 20px rgba(59,130,246,0.25)',
                  letterSpacing: '-0.01em',
                }}>
                <Video size={18} />
                Start Video Chat
              </motion.button>

              <motion.button
                onClick={() => {
                  streamRef.current?.getTracks().forEach(t => t.stop());
                  streamRef.current = null;
                  setCameraOn(false);
                  navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } });
                }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-black text-[15px]"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '-0.01em',
                }}>
                <VideoOff size={18} />
                Start Without Camera
              </motion.button>
            </div>

            {/* Filter card */}
            <div className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-5">

                {/* GENDER */}
                <div className="flex-1">
                  <p className="text-[9.5px] font-black tracking-[0.18em] uppercase mb-2"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>GENDER</p>
                  <div className="flex gap-1">
                    {[['Both', 'both'], ['Male', 'male'], ['Female', 'female']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => handleGender(val)}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-1.5 text-[12px] font-bold rounded-lg"
                        style={filterGender === val
                          ? { background: '#2563eb', color: 'white' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch', marginTop: 4 }} />

                {/* COUNTRY */}
                <div>
                  <p className="text-[9.5px] font-black tracking-[0.18em] uppercase mb-2"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>COUNTRY</p>
                  <motion.button
                    ref={countryBtnRef}
                    onClick={handleCountryClick}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: filterCountry ? 'white' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                    {user?.isVip
                      ? <Globe size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      : <Lock size={12} style={{ opacity: 0.3 }} />}
                    {filterCountry || 'Any country'}
                    <ChevronDown size={11} style={{ color: 'rgba(255,255,255,0.25)', transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </motion.button>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch', marginTop: 4 }} />

                {/* MODE */}
                <div className="flex-1">
                  <p className="text-[9.5px] font-black tracking-[0.18em] uppercase mb-2"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>MODE</p>
                  <div className="flex gap-1">
                    {[['Solo', 'solo'], ['Duo', 'squad'], ['Private', 'private']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => setMode(val)}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 py-1.5 text-[12px] font-bold rounded-lg"
                        style={mode === val
                          ? { background: '#2563eb', color: 'white' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Settings icon */}
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAdvanced(v => !v)}
                  className="self-end mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <SlidersHorizontal size={17} />
                </motion.button>

              </div>
            </div>

          </div>

          {/* RIGHT: Camera preview */}
          <div className="flex-1 relative overflow-hidden"
            style={{ borderRadius: '16px 0 0 16px', margin: '12px 0 12px 0' }}>

            {/* Live feed */}
            <video ref={videoRefDesktop} autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center top', opacity: cameraOn && !cameraErr ? 1 : 0, transition: 'opacity 0.5s' }} />

            {/* Idle state */}
            {(!cameraOn || cameraErr) && (
              <div className="absolute inset-0">
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&auto=format&fit=crop&q=80" alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(8,8,16,0.18) 0%, rgba(15,20,50,0.12) 100%)' }} />
                {cameraErr && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(8,8,16,0.72)' }}>
                    <VideoOff size={28} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 12 }} />
                    <p className="text-white/60 text-sm font-semibold mb-1">Camera blocked</p>
                    <p className="text-white/25 text-xs mb-5 text-center" style={{ maxWidth: 180 }}>
                      {cameraErrMsg || 'Allow camera access in browser settings'}
                    </p>
                    <motion.button onClick={enableCamera}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)' }}>
                      <Camera size={14} /> Try Again
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {/* Subtle enable-camera button (when idle, no error) */}
            {!cameraOn && !cameraErr && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                <motion.button onClick={enableCamera}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Camera size={14} />
                  Enable your camera
                </motion.button>
              </div>
            )}

            {/* Top-left icons (when live) */}
            {cameraOn && !cameraErr && (
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Camera size={15} className="text-white/70" />
                </motion.button>
              </div>
            )}

            {/* Vignette edges */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(8,8,16,0.25) 0%, transparent 20%, transparent 80%, rgba(8,8,16,0.1) 100%)' }} />

          </div>

        </div>

      </section>

      `;

c = c.slice(0, lineStart + 1) + newSection + c.slice(howLineStart + 1);
fs.writeFileSync(mainFile, c, 'utf8');
console.log('Desktop section replaced — Hero layout');
console.log('Done!');
