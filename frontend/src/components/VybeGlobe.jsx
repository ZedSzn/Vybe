export default function VybeGlobe({ size = 200 }) {
  const id = 'vg'

  // Equirectangular 720×360: x = (lng+180)*2, y = (90-lat)*2
  const landPaths = [
    // Greenland
    'M244,28 L256,18 L272,12 L292,10 L314,16 L326,24 L330,34 L326,46 L316,56 L300,62 L278,66 L260,62 L248,54 L242,42 L244,28Z',
    // Iceland
    'M306,50 L316,44 L330,44 L338,48 L336,56 L324,60 L312,58 L306,52Z',
    // North America — detailed
    'M54,54 L40,60 L26,70 L22,82 L28,90 L44,84 L60,72 L76,64 L92,66 L104,72 L112,86 L120,100 L128,114 L138,122 L150,134 L164,148 L180,158 L200,166 L214,170 L228,168 L236,158 L228,150 L214,142 L200,130 L200,122 L208,110 L216,100 L222,90 L234,88 L250,84 L260,76 L262,66 L256,56 L246,50 L228,42 L206,32 L180,26 L158,28 L136,36 L114,44 L92,50 L72,52Z',
    // Florida peninsula
    'M196,146 L200,154 L202,162 L198,166 L194,162 L192,154 L194,146Z',
    // Central America
    'M150,152 L156,158 L162,166 L168,172 L174,180 L172,188 L166,190 L160,184 L154,174 L148,164 L146,156Z',
    // Caribbean (Cuba approx)
    'M196,148 L208,144 L218,146 L220,150 L208,152 L196,150Z',
    // South America
    'M208,168 L222,162 L236,162 L248,170 L258,180 L268,196 L274,212 L280,228 L284,244 L286,260 L280,276 L270,288 L258,296 L248,294 L238,282 L232,266 L226,248 L220,230 L214,210 L208,190 L204,180Z',
    // UK
    'M338,68 L346,64 L354,68 L358,76 L356,84 L350,88 L344,86 L338,78 L338,68Z',
    // Ireland
    'M326,72 L334,70 L340,74 L338,82 L330,82 L326,76Z',
    // Scandinavia — Norway/Sweden
    'M376,40 L382,30 L388,22 L396,18 L402,22 L408,32 L408,42 L402,48 L394,50 L386,46 L378,42Z M396,20 L404,14 L412,14 L416,20 L414,30 L408,34 L402,28Z M412,18 L420,16 L426,20 L424,30 L418,34 L414,28Z',
    // Denmark + Finland
    'M388,56 L394,52 L400,54 L400,60 L394,62 L388,58Z M418,32 L426,26 L432,28 L434,36 L430,44 L422,46 L418,40Z',
    // Europe — mainland
    'M358,58 L366,50 L376,46 L388,42 L400,38 L412,36 L420,38 L424,44 L418,52 L412,60 L406,66 L412,70 L422,74 L426,80 L424,88 L418,94 L410,98 L402,96 L392,100 L382,96 L370,90 L362,84 L358,76 L362,68 L360,62Z',
    // Italy boot
    'M402,96 L408,98 L416,102 L422,110 L418,118 L412,122 L406,118 L402,110 L400,100Z M416,120 L420,116 L422,122 L420,126 L416,122Z',
    // Spain + Portugal
    'M336,90 L342,84 L350,82 L360,82 L368,86 L372,94 L366,102 L354,106 L342,104 L334,98Z',
    // Greece + Balkans
    'M418,90 L428,88 L436,90 L440,96 L436,104 L428,106 L420,102 L416,96Z M428,106 L432,110 L430,116 L426,112Z',
    // Africa — detailed
    'M348,110 L356,104 L366,100 L378,100 L392,102 L406,108 L420,116 L432,126 L444,140 L454,156 L462,164 L468,174 L464,186 L456,198 L448,210 L444,224 L438,238 L428,248 L416,252 L402,252 L390,248 L380,236 L374,220 L372,204 L370,188 L364,174 L354,164 L342,156 L330,146 L324,134 L324,122 L328,112 L338,108Z',
    // Horn of Africa
    'M468,174 L476,168 L484,166 L490,170 L488,180 L480,186 L470,184Z',
    // Middle East / Arabian Peninsula
    'M434,96 L446,88 L458,84 L468,84 L478,90 L482,100 L480,112 L472,120 L462,124 L450,122 L440,116 L434,106Z M450,122 L458,126 L464,136 L468,148 L462,152 L454,146 L448,134 L448,124Z',
    // India subcontinent
    'M498,106 L510,102 L522,104 L530,112 L532,124 L530,136 L526,148 L520,158 L514,164 L506,160 L498,150 L492,138 L490,124 L492,112Z',
    // Sri Lanka
    'M520,164 L526,160 L530,164 L528,170 L522,170Z',
    // Asia — main body
    'M428,36 L444,30 L462,26 L484,24 L506,22 L528,22 L550,24 L572,24 L594,22 L614,20 L634,20 L652,24 L666,30 L676,38 L682,48 L680,60 L672,70 L658,76 L640,80 L624,84 L614,90 L606,98 L600,108 L596,120 L598,132 L606,140 L616,146 L626,142 L636,134 L648,128 L658,126 L668,130 L672,140 L668,150 L658,156 L646,160 L634,162 L622,164 L612,170 L606,178 L598,182 L588,180 L576,176 L566,172 L554,172 L546,178 L540,184 L532,178 L524,168 L516,160 L510,164 L506,150 L510,138 L514,126 L512,114 L504,106 L494,100 L480,96 L466,92 L452,90 L442,90 L434,94 L428,100 L422,106 L420,96 L424,84 L432,76 L440,68 L444,60 L440,52 L432,44Z',
    // Tibet plateau edge
    'M510,88 L522,84 L534,84 L544,88 L546,96 L538,100 L526,100 L514,96Z',
    // Southeast Asia mainland
    'M548,134 L558,126 L566,120 L576,118 L582,124 L580,136 L574,146 L564,150 L554,148 L548,140Z',
    // Japan — main islands
    'M624,88 L630,82 L638,80 L644,84 L644,92 L638,98 L630,98 L624,92Z M614,100 L622,96 L630,98 L634,106 L630,114 L622,116 L616,110Z',
    // Taiwan
    'M610,130 L614,126 L618,128 L618,136 L614,138 L610,134Z',
    // Philippines
    'M574,140 L580,136 L586,140 L584,150 L578,154 L572,150Z M578,152 L584,150 L586,158 L582,162 L576,158Z',
    // Borneo
    'M568,162 L580,156 L592,158 L598,164 L598,176 L590,182 L578,182 L568,174Z',
    // Sumatra + Java
    'M544,176 L558,170 L572,170 L584,174 L586,182 L576,186 L562,186 L548,180Z M570,174 L580,170 L594,168 L602,172 L604,180 L594,182 L580,178Z',
    // Australia
    'M586,220 L594,210 L606,204 L620,202 L636,204 L650,210 L662,218 L668,230 L672,244 L668,258 L658,266 L644,270 L628,270 L614,264 L602,256 L594,244 L588,232Z',
    // New Zealand
    'M680,252 L688,246 L694,250 L692,260 L686,264 L680,258Z M676,268 L684,262 L690,266 L692,276 L684,282 L678,276Z',
    // Madagascar
    'M446,188 L454,182 L462,184 L466,196 L464,210 L456,218 L448,216 L444,204 L446,192Z',
  ]

  const latLines = [60, 120, 180, 240, 300]
  const lonLines = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720]
  const svgW = 720
  const svgH = 360

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0, overflow: 'visible' }}>
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
        @keyframes ${id}_dot_cw {
          from { transform: translate(-50%,-50%) rotate(0deg) translateY(-${size * 0.68}px); }
          to   { transform: translate(-50%,-50%) rotate(360deg) translateY(-${size * 0.68}px); }
        }
        @keyframes ${id}_dot_ccw {
          from { transform: translate(-50%,-50%) rotate(0deg) translateY(-${size * 0.82}px); }
          to   { transform: translate(-50%,-50%) rotate(-360deg) translateY(-${size * 0.82}px); }
        }
        @keyframes ${id}_dot2_ccw {
          from { transform: translate(-50%,-50%) rotate(120deg) translateY(-${size * 0.82}px); }
          to   { transform: translate(-50%,-50%) rotate(-240deg) translateY(-${size * 0.82}px); }
        }
      `}</style>

      {/* Sweeping whirl glow */}
      <div style={{
        position: 'absolute',
        width: size * 1.18,
        height: size * 1.18,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg,
          transparent 0%,
          transparent 50%,
          rgba(124,58,237,0.08) 68%,
          rgba(99,102,241,0.18) 80%,
          rgba(27,98,245,0.12) 90%,
          transparent 100%)`,
        animation: `${id}_sweep 3.8s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Inner dashed ring — clockwise */}
      <div style={{
        position: 'absolute',
        width: size * 1.3,
        height: size * 1.3,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%) rotate(0deg)',
        borderRadius: '50%',
        border: '1px dashed rgba(124,58,237,0.5)',
        animation: `${id}_cw 9s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Outer dashed ring — counter-clockwise */}
      <div style={{
        position: 'absolute',
        width: size * 1.58,
        height: size * 1.58,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%) rotate(0deg)',
        borderRadius: '50%',
        border: '1px dashed rgba(27,98,245,0.35)',
        animation: `${id}_ccw 15s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbiting dot — inner ring */}
      <div style={{
        position: 'absolute',
        width: 6,
        height: 6,
        top: '50%',
        left: '50%',
        borderRadius: '50%',
        background: 'rgba(139,92,246,1)',
        boxShadow: '0 0 8px 2px rgba(124,58,237,0.8)',
        animation: `${id}_dot_cw 9s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbiting dot 1 — outer ring */}
      <div style={{
        position: 'absolute',
        width: 5,
        height: 5,
        top: '50%',
        left: '50%',
        borderRadius: '50%',
        background: 'rgba(96,165,250,1)',
        boxShadow: '0 0 6px 2px rgba(27,98,245,0.7)',
        animation: `${id}_dot_ccw 15s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbiting dot 2 — outer ring, offset */}
      <div style={{
        position: 'absolute',
        width: 4,
        height: 4,
        top: '50%',
        left: '50%',
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.9)',
        boxShadow: '0 0 5px rgba(99,102,241,0.7)',
        animation: `${id}_dot2_ccw 15s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Globe circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          background: 'radial-gradient(circle at 38% 35%, #0d1640, #070d28 55%, #030810)',
          boxShadow: `0 0 ${Math.round(size * 0.16)}px rgba(124,58,237,0.45),
                      0 0 ${Math.round(size * 0.35)}px rgba(124,58,237,0.12),
                      inset 0 0 ${Math.round(size * 0.08)}px rgba(0,0,0,0.7)`,
          zIndex: 1,
        }}
      >
        {/* Scrolling map strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200%',
            height: '100%',
            animation: `${id}_scroll 24s linear infinite`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${svgW * 2} ${svgH}`}
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Grid lines — two copies */}
            {[0, svgW].map((ox) => (
              <g key={ox} stroke="rgba(99,102,241,0.08)" strokeWidth="0.4" fill="none">
                {latLines.map((y) => <line key={y} x1={ox} y1={y} x2={ox + svgW} y2={y} />)}
                {lonLines.map((x) => <line key={x} x1={ox + x} y1={0} x2={ox + x} y2={svgH} />)}
              </g>
            ))}

            {/* Land — two copies */}
            {[0, svgW].map((ox) => (
              <g
                key={ox}
                fill="rgba(99,102,241,0.20)"
                stroke="rgba(139,92,246,0.55)"
                strokeWidth="0.75"
                strokeLinejoin="round"
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

        {/* Sphere edge shading */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 38%,
              transparent 12%,
              rgba(3,8,20,0.12) 48%,
              rgba(3,8,20,0.65) 80%,
              rgba(3,8,20,0.94) 100%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Specular highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 26%, rgba(167,139,250,0.20) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
