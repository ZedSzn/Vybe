// Spinning globe animation for the ChatPage search state.
// Uses a scrolling equirectangular SVG map clipped to a circle — two copies
// placed side-by-side; the wrapper scrolls one full map-width, creating a
// seamless infinite rotation illusion with no WebGL required.
export default function VybeGlobe({ size = 180 }) {
  const id = 'vg'

  // Equirectangular 720×360 coordinate system:
  //   x = (lng + 180) * 2     y = (90 - lat) * 2
  const landPaths = [
    // Greenland
    'M240,28 L270,14 L320,28 L324,40 L310,54 L276,60 L254,54 L240,40Z',
    // Iceland
    'M312,50 L332,50 L334,46 L316,46Z',
    // North America
    'M24,48 L26,72 L64,60 L106,80 L112,92 L126,114 L180,150 L206,164 L192,136 L198,130 L210,110 L212,98 L228,92 L234,92 L254,88 L250,60 L230,50 L200,20 L160,32 L120,38 L84,60 L36,48Z',
    // South America
    'M206,164 L234,160 L246,168 L290,196 L274,226 L256,248 L246,256 L230,280 L226,290 L220,240 L206,190 L200,180 L206,164Z',
    // UK
    'M352,70 L358,78 L352,86 L344,80Z',
    // Ireland
    'M340,74 L346,78 L342,84 L336,80Z',
    // Europe (mainland)
    'M342,104 L356,92 L356,82 L368,76 L378,66 L392,44 L412,38 L420,40 L420,60 L404,72 L424,80 L420,92 L416,96 L432,96 L432,108 L404,108 L392,104 L376,92 L366,94 L360,98 L342,104Z',
    // Africa
    'M348,108 L356,110 L380,106 L400,114 L424,118 L446,156 L462,158 L442,182 L440,202 L430,220 L424,236 L396,250 L384,214 L384,190 L366,172 L350,170 L326,150 L334,124 L348,108Z',
    // Asia
    'M432,96 L434,108 L430,120 L450,156 L476,136 L492,134 L516,166 L520,156 L544,138 L556,160 L568,178 L596,178 L604,164 L620,116 L640,94 L684,76 L684,44 L600,36 L560,34 L500,30 L440,34 L420,40 L420,60 L404,72 L424,80 L420,92 L432,96Z',
    // Japan
    'M618,108 L622,102 L628,100 L632,104 L630,110 L624,114 L618,108Z',
    // Australia
    'M588,224 L588,250 L616,252 L628,250 L638,254 L656,260 L668,236 L660,224 L648,216 L636,210 L616,210 L604,218 L588,224Z',
    // New Zealand (north island)
    'M682,262 L686,256 L690,260 L688,266 L682,262Z',
    // New Zealand (south island)
    'M680,270 L686,268 L690,276 L684,282 L678,276 L680,270Z',
    // Madagascar
    'M448,192 L454,188 L460,196 L458,212 L452,218 L446,208 L448,192Z',
    // Sri Lanka
    'M528,162 L532,158 L536,162 L534,168 L528,162Z',
    // Philippines (approx)
    'M576,148 L580,144 L584,148 L582,156 L576,152 L576,148Z',
    // Indonesia (Java + Sumatra approx)
    'M546,178 L560,174 L572,178 L580,186 L568,188 L552,186 L546,178Z',
    // Borneo
    'M572,166 L584,162 L592,168 L590,178 L578,182 L570,174 L572,166Z',
  ]

  // Latitude grid lines (y values for every 30°)
  const latLines = [60, 120, 180, 240, 300]
  // Longitude grid lines (x values for every 30°)
  const lonLines = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720]

  // The SVG is 720×360. We place two copies side by side (1440×360), then
  // animate translateX from 0 to -50% (one full map width) so it loops.
  const svgW = 720
  const svgH = 360

  const animDuration = '22s'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        background: 'radial-gradient(circle at 38% 35%, #0d1640, #070d28 55%, #030810)',
        boxShadow: `0 0 ${Math.round(size * 0.14)}px rgba(124,58,237,0.3), inset 0 0 ${Math.round(size * 0.08)}px rgba(0,0,0,0.6)`,
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
          animation: `${id}_scroll ${animDuration} linear infinite`,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${svgW * 2} ${svgH}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid slice"
        >
          <style>{`
            @keyframes ${id}_scroll {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }
          `}</style>

          {/* Grid — two copies */}
          {[0, svgW].map((offsetX) => (
            <g key={offsetX} stroke="rgba(99,102,241,0.13)" strokeWidth="0.5" fill="none">
              {latLines.map((y) => (
                <line key={y} x1={offsetX} y1={y} x2={offsetX + svgW} y2={y} />
              ))}
              {lonLines.map((x) => (
                <line key={x} x1={offsetX + x} y1={0} x2={offsetX + x} y2={svgH} />
              ))}
            </g>
          ))}

          {/* Land — two copies, second offset by svgW */}
          {[0, svgW].map((offsetX) => (
            <g
              key={offsetX}
              fill="rgba(99,102,241,0.28)"
              stroke="rgba(139,92,246,0.65)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            >
              {landPaths.map((d, i) => {
                // Shift all x coordinates by offsetX
                const shifted = d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
                  `${parseFloat(x) + offsetX},${y}`
                )
                return <path key={i} d={shifted} />
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Sphere shading overlay — fades edges to simulate curvature */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 38%,
            transparent 15%,
            rgba(3,8,20,0.18) 50%,
            rgba(3,8,20,0.72) 82%,
            rgba(3,8,20,0.92) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Specular highlight — top-left glint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 28%, rgba(147,129,255,0.16) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
