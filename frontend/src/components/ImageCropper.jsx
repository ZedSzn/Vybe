import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ZoomIn } from 'lucide-react'

// Fixed 3:4 portrait crop — matches the camera-panel framing.
const VIEW_W = 280
const ASPECT = 3 / 4
const VIEW_H = Math.round(VIEW_W / ASPECT)
const OUT_W  = 720
const OUT_H  = Math.round(OUT_W / ASPECT)

export default function ImageCropper({ src, onCancel, onApply }) {
  const [img,  setImg]  = useState(null)
  const [cover, setCover] = useState(1)   // base scale that makes the image cover the frame
  const [zoom, setZoom] = useState(1)     // user zoom multiplier (>= 1)
  const [pos,  setPos]  = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => {
      const c = Math.max(VIEW_W / i.naturalWidth, VIEW_H / i.naturalHeight)
      const dw = i.naturalWidth * c
      const dh = i.naturalHeight * c
      setImg(i)
      setCover(c)
      setZoom(1)
      setPos({ x: (VIEW_W - dw) / 2, y: (VIEW_H - dh) / 2 })
    }
    i.src = src
  }, [src])

  // Keep the image covering the frame at all times.
  const clampPos = useCallback((p, z) => {
    if (!img) return p
    const dw = img.naturalWidth  * cover * z
    const dh = img.naturalHeight * cover * z
    return {
      x: Math.min(0, Math.max(VIEW_W - dw, p.x)),
      y: Math.min(0, Math.max(VIEW_H - dh, p.y)),
    }
  }, [img, cover])

  const onDown = (e) => {
    const pt = e.touches?.[0] || e
    drag.current = { sx: pt.clientX, sy: pt.clientY, px: pos.x, py: pos.y }
  }
  const onMove = (e) => {
    if (!drag.current) return
    const pt = e.touches?.[0] || e
    setPos(clampPos({
      x: drag.current.px + (pt.clientX - drag.current.sx),
      y: drag.current.py + (pt.clientY - drag.current.sy),
    }, zoom))
  }
  const onUp = () => { drag.current = null }

  const changeZoom = (z) => {
    z = Math.max(1, Math.min(4, z))
    setPos((p) => {
      if (!img) return p
      // Zoom around the frame centre so the focus point stays put.
      const fx = (VIEW_W / 2 - p.x) / (img.naturalWidth  * cover * zoom)
      const fy = (VIEW_H / 2 - p.y) / (img.naturalHeight * cover * zoom)
      return clampPos({
        x: VIEW_W / 2 - fx * img.naturalWidth  * cover * z,
        y: VIEW_H / 2 - fy * img.naturalHeight * cover * z,
      }, z)
    })
    setZoom(z)
  }

  const apply = () => {
    if (!img) return
    const s = cover * zoom
    const canvas = document.createElement('canvas')
    canvas.width  = OUT_W
    canvas.height = OUT_H
    canvas.getContext('2d').drawImage(
      img,
      -pos.x / s, -pos.y / s, VIEW_W / s, VIEW_H / s,
      0, 0, OUT_W, OUT_H,
    )
    onApply(canvas.toDataURL('image/jpeg', 0.85))
  }

  const dw = img ? img.naturalWidth  * cover * zoom : 0
  const dh = img ? img.naturalHeight * cover * zoom : 0

  return (
    <div
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchMove={onMove} onTouchEnd={onUp}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 20 }}
    >
      <div style={{ background: '#11131c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, width: 'min(92vw, 340px)' }}>
        <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Crop camera background</p>
        <p style={{ color: '#888899', fontSize: 11, margin: '4px 0 14px' }}>Drag to reposition · slide to zoom</p>

        <div
          onMouseDown={onDown} onTouchStart={onDown}
          style={{ position: 'relative', width: VIEW_W, height: VIEW_H, margin: '0 auto', borderRadius: 12, overflow: 'hidden', cursor: 'grab', background: '#000', touchAction: 'none', userSelect: 'none' }}
        >
          {img && (
            <img
              src={src} alt="" draggable={false}
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: dw, height: dh, maxWidth: 'none', pointerEvents: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <ZoomIn size={14} style={{ color: '#888899', flexShrink: 0 }} />
          <input
            type="range" min="1" max="4" step="0.01" value={zoom}
            onChange={(e) => changeZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#00D4FF' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button" onClick={onCancel}
            style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#888899', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={apply}
            style={{ flex: 1, padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(140deg, #004466 0%, #00D4FF 100%)', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  )
}
