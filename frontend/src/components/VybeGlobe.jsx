export default function VybeGlobe({ size = 200 }) {
  const id = 'vg'

  // Globe occupies 66% of total size — rings stay fully inside the size×size box
  const g = Math.round(size * 0.66)

  // Equirectangular 720×360: x=(lng+180)*2, y=(90-lat)*2
  // Paths are much more geographically accurate anchor points
  const landPaths = [
    // ── North America ──────────────────────────────────────────────
    'M46,38 L32,48 L20,62 L18,76 L24,86 L16,94 L24,100 L38,94 L52,80 L64,70 L78,64 L94,66 L108,72 L116,84 L116,98 L108,108 L100,118 L98,128 L104,134 L114,130 L122,136 L132,144 L142,152 L148,160 L150,168 L158,170 L166,164 L170,154 L168,142 L172,132 L166,122 L170,112 L182,110 L196,114 L204,126 L204,136 L200,148 L202,158 L198,168 L202,172 L210,168 L212,158 L210,148 L216,138 L224,132 L232,138 L236,148 L242,136 L248,122 L256,110 L264,100 L264,90 L256,80 L244,72 L228,62 L208,52 L186,44 L162,38 L136,34 L110,36 L86,40 L66,40Z',
    // Greenland
    'M250,12 L264,6 L282,4 L300,6 L318,14 L328,24 L330,36 L324,48 L314,58 L298,62 L278,64 L260,60 L248,50 L244,36 L248,22Z',
    // Alaska peninsula
    'M18,76 L8,82 L4,92 L14,96 L26,92 L36,84 L40,74 L30,68Z',
    // Florida
    'M198,130 L202,142 L202,154 L198,162 L194,154 L192,142 L194,130Z',
    // Cuba
    'M192,138 L206,134 L220,134 L226,140 L222,146 L208,148 L196,146Z',

    // ── South America ───────────────────────────────────────────────
    'M166,162 L178,158 L192,158 L206,164 L218,172 L228,184 L238,198 L248,214 L256,230 L260,248 L262,264 L260,278 L254,290 L244,298 L232,300 L220,292 L210,278 L204,262 L200,244 L198,226 L196,208 L192,192 L186,178 L176,166Z',
    // Venezuela bump
    'M206,164 L218,160 L230,162 L236,168 L228,172 L216,170Z',

    // ── Europe ──────────────────────────────────────────────────────
    'M332,72 L340,66 L348,62 L358,58 L370,54 L382,50 L394,46 L406,44 L416,48 L420,56 L418,66 L412,72 L408,76 L412,82 L420,88 L424,96 L422,104 L416,110 L406,114 L396,112 L386,104 L374,96 L362,90 L350,88 L340,90 L332,84 L330,76Z',
    // Iberian Peninsula
    'M328,80 L336,74 L344,72 L354,74 L362,80 L362,90 L354,98 L342,102 L330,96 L326,86Z',
    // UK
    'M334,62 L342,58 L350,60 L354,68 L352,76 L346,80 L338,78 L334,70Z',
    // Ireland
    'M322,68 L330,64 L336,66 L336,74 L330,78 L322,74Z',
    // Scandinavia
    'M372,38 L378,30 L386,22 L394,18 L400,24 L402,34 L398,44 L390,48 L382,46Z M394,18 L402,12 L410,14 L414,22 L412,32 L406,34 L400,24Z M410,16 L418,14 L424,20 L424,30 L418,34 L412,28Z',
    // Italy
    'M396,88 L402,84 L408,86 L414,94 L416,104 L414,114 L410,118 L406,112 L402,102 L398,92Z M410,116 L414,112 L418,118 L416,124 L412,120Z',
    // Greece
    'M414,96 L422,92 L430,96 L432,104 L426,110 L416,108Z',
    // Balkans
    'M408,80 L416,76 L424,78 L428,86 L424,94 L416,94 L410,88Z',

    // ── Africa ──────────────────────────────────────────────────────
    'M330,104 L342,98 L356,94 L372,92 L388,94 L404,100 L418,108 L430,120 L440,134 L448,150 L452,166 L452,182 L448,196 L442,210 L438,226 L430,240 L418,252 L404,256 L390,252 L376,242 L364,228 L354,212 L346,196 L340,180 L334,164 L324,150 L314,136 L312,122 L316,110Z',
    // Horn of Africa / Somalia
    'M452,168 L462,162 L474,158 L484,162 L482,174 L472,182 L460,180Z',
    // Madagascar
    'M448,186 L456,180 L464,182 L468,196 L466,210 L456,218 L448,214 L444,202Z',
    // Sinai / Nile delta
    'M428,108 L436,104 L444,106 L446,114 L438,116 L428,114Z',

    // ── Middle East / Arabia ─────────────────────────────────────────
    'M432,94 L448,86 L462,82 L474,82 L484,88 L486,102 L480,116 L468,124 L454,128 L440,122 L434,110Z M452,128 L460,132 L466,146 L462,156 L452,150 L448,136 L450,128Z',

    // ── India ───────────────────────────────────────────────────────
    'M492,100 L508,96 L524,98 L534,108 L536,122 L530,138 L522,152 L514,162 L504,164 L494,156 L488,142 L486,126 L490,112Z',
    // Sri Lanka
    'M518,164 L524,160 L528,164 L526,170 L520,170Z',

    // ── Asia ────────────────────────────────────────────────────────
    'M418,42 L436,34 L456,28 L480,24 L506,20 L532,20 L558,20 L584,20 L608,18 L632,18 L652,22 L668,30 L678,42 L678,56 L668,68 L652,76 L634,80 L618,84 L608,94 L600,106 L596,120 L600,132 L610,142 L622,140 L636,130 L650,124 L664,122 L672,130 L672,144 L664,154 L650,160 L636,164 L622,168 L612,176 L600,182 L586,180 L570,174 L554,170 L540,174 L534,182 L524,176 L518,164 L522,150 L528,136 L522,122 L512,110 L498,104 L482,98 L466,94 L450,90 L436,90 L426,94 L420,100 L414,96 L416,80 L422,70 L430,60 L432,50Z',
    // Tibetan Plateau edge
    'M508,86 L522,80 L538,80 L548,86 L548,96 L536,100 L522,98 L510,92Z',
    // Japan
    'M624,76 L632,70 L640,68 L646,72 L646,82 L640,88 L632,88 L624,82Z M614,90 L622,84 L632,86 L636,96 L630,104 L620,104 L616,96Z',
    // Taiwan
    'M608,124 L614,120 L618,122 L618,130 L614,134 L608,130Z',
    // Southeast Asia
    'M548,128 L560,120 L570,116 L582,118 L584,128 L580,140 L568,146 L556,142 L548,134Z',
    // Philippines
    'M578,130 L584,126 L592,130 L590,140 L582,144 L578,136Z M576,148 L582,142 L590,146 L588,158 L580,160 L576,154Z',
    // Borneo
    'M566,158 L580,150 L596,152 L602,162 L600,174 L588,180 L574,178 L566,168Z',
    // Sumatra
    'M540,170 L558,162 L576,160 L590,164 L592,174 L578,178 L560,178 L546,172Z',
    // Java
    'M558,174 L576,168 L594,168 L606,172 L606,180 L592,182 L574,180 L560,178Z',
    // Papua New Guinea
    'M610,178 L626,170 L642,168 L656,170 L660,178 L652,186 L636,188 L620,186Z',

    // ── Australia ───────────────────────────────────────────────────
    'M582,216 L594,206 L610,200 L628,196 L646,198 L662,204 L672,214 L676,228 L676,244 L670,258 L658,266 L642,270 L626,268 L610,262 L596,252 L586,238 L580,224Z',
    // New Zealand
    'M676,248 L684,240 L692,244 L692,256 L686,262 L676,256Z M672,266 L680,260 L688,264 L688,276 L682,282 L672,274Z',
    // Tasmania
    'M634,272 L642,268 L648,272 L648,280 L640,282 L634,278Z',

    // ── Iceland ─────────────────────────────────────────────────────
    'M306,46 L318,40 L332,40 L340,46 L338,56 L326,60 L314,58 L306,52Z',
  ]

  const latLines  = [60, 120, 180, 240, 300]
  const lonLines  = [120, 240, 360, 480, 600]
  const svgW = 720, svgH = 360

  // Inner ring radius  = size * 0.39  →  diameter = size * 0.78  (fits inside size)
  // Outer ring radius  = size * 0.475 →  diameter = size * 0.95  (fits inside size)
  const r1 = Math.round(size * 0.39)
  const r2 = Math.round(size * 0.475)

  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes ${id}_scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes ${id}_cw {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes ${id}_ccw {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(-360deg); }
        }
        @keyframes ${id}_sweep {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes ${id}_atmo {
          0%,100% { opacity: 0.55; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.85; transform: translate(-50%,-50%) scale(1.04); }
        }
        @keyframes ${id}_d1 {
          from { transform: translate(-50%,-50%) rotate(0deg)    translateY(-${r1}px); }
          to   { transform: translate(-50%,-50%) rotate(360deg)  translateY(-${r1}px); }
        }
        @keyframes ${id}_d2 {
          from { transform: translate(-50%,-50%) rotate(50deg)   translateY(-${r2}px); }
          to   { transform: translate(-50%,-50%) rotate(410deg)  translateY(-${r2}px); }
        }
        @keyframes ${id}_d3 {
          from { transform: translate(-50%,-50%) rotate(200deg)  translateY(-${r2}px); }
          to   { transform: translate(-50%,-50%) rotate(560deg)  translateY(-${r2}px); }
        }
      `}</style>

      {/* ── Atmospheric ambient glow ── */}
      <div style={{
        position: 'absolute',
        width: size * 0.86,
        height: size * 0.86,
        top: '50%', left: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.14) 0%, rgba(0,212,255,0.08) 45%, transparent 72%)',
        animation: `${id}_atmo 5s ease-in-out infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Sweeping conic glow ── */}
      <div style={{
        position: 'absolute',
        width: size * 0.80,
        height: size * 0.80,
        top: '50%', left: '50%',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg,
          transparent 0%,
          transparent 52%,
          rgba(0,212,255,0.04) 68%,
          rgba(0,184,224,0.15) 82%,
          rgba(0,212,255,0.07) 92%,
          transparent 100%)`,
        animation: `${id}_sweep 4.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Inner dashed orbit ring ── */}
      <div style={{
        position: 'absolute',
        width: r1 * 2,
        height: r1 * 2,
        top: '50%', left: '50%',
        borderRadius: '50%',
        border: '1px dashed rgba(0,212,255,0.38)',
        animation: `${id}_cw 11s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Outer dashed orbit ring ── */}
      <div style={{
        position: 'absolute',
        width: r2 * 2,
        height: r2 * 2,
        top: '50%', left: '50%',
        borderRadius: '50%',
        border: '1px dashed rgba(0,212,255,0.28)',
        animation: `${id}_ccw 18s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Orbiting dot – inner ring ── */}
      <div style={{
        position: 'absolute',
        width: 5, height: 5,
        top: '50%', left: '50%',
        borderRadius: '50%',
        background: '#00D4FF',
        boxShadow: '0 0 8px 3px rgba(0,212,255,0.9)',
        animation: `${id}_d1 11s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Orbiting dot 1 – outer ring ── */}
      <div style={{
        position: 'absolute',
        width: 4, height: 4,
        top: '50%', left: '50%',
        borderRadius: '50%',
        background: '#00B8E0',
        boxShadow: '0 0 7px 2px rgba(0,212,255,0.9)',
        animation: `${id}_d2 18s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Orbiting dot 2 – outer ring, offset ── */}
      <div style={{
        position: 'absolute',
        width: 3, height: 3,
        top: '50%', left: '50%',
        borderRadius: '50%',
        background: '#33DDFF',
        boxShadow: '0 0 5px 1px rgba(0,184,224,0.8)',
        animation: `${id}_d3 18s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Globe sphere ── */}
      <div style={{
        width: g,
        height: g,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        background: 'radial-gradient(circle at 36% 30%, #061828, #030e18 52%, #010810)',
        boxShadow: `
          0 0 ${Math.round(g * 0.22)}px rgba(0,212,255,0.40),
          0 0 ${Math.round(g * 0.50)}px rgba(0,212,255,0.14),
          0 0 ${Math.round(g * 0.90)}px rgba(0,212,255,0.07),
          inset 0 0 ${Math.round(g * 0.12)}px rgba(0,0,0,0.9)
        `,
      }}>

        {/* Scrolling equirectangular map */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '200%',
          height: '100%',
          animation: `${id}_scroll 26s linear infinite`,
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${svgW * 2} ${svgH}`}
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Graticule (subtle grid) */}
            {[0, svgW].map((ox) => (
              <g key={ox} stroke="rgba(0,212,255,0.05)" strokeWidth="0.5" fill="none">
                {latLines.map((y) => <line key={y} x1={ox} y1={y} x2={ox + svgW} y2={y} />)}
                {lonLines.map((x) => <line key={x} x1={ox + x} y1={0} x2={ox + x} y2={svgH} />)}
              </g>
            ))}

            {/* Land masses – two copies for seamless scroll */}
            {[0, svgW].map((ox) => (
              <g
                key={ox}
                fill="rgba(0,212,255,0.18)"
                stroke="rgba(0,212,255,0.55)"
                strokeWidth="0.7"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                {landPaths.map((d, i) => {
                  const shifted = d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
                    (_, x, y) => `${parseFloat(x) + ox},${y}`)
                  return <path key={i} d={shifted} />
                })}
              </g>
            ))}
          </svg>
        </div>

        {/* Edge vignette – deep shadow at rim */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 36% 34%,
            transparent 18%,
            rgba(3,8,20,0.08) 52%,
            rgba(3,8,20,0.72) 82%,
            rgba(2,5,16,0.97) 100%)`,
          pointerEvents: 'none',
        }} />

        {/* Atmospheric rim glow */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,212,255,0.08) 74%, rgba(0,212,255,0.22) 88%, rgba(0,212,255,0.08) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Primary specular highlight (top-left) */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 28% 22%, rgba(200,245,255,0.22) 0%, rgba(0,212,255,0.08) 28%, transparent 52%)',
          pointerEvents: 'none',
        }} />

        {/* Secondary soft fill (bottom-right) */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 72% 78%, rgba(0,212,255,0.14) 0%, transparent 42%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
