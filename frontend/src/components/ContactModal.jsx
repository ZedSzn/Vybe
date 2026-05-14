import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstInputRef.current?.focus(), 80)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reset = () => {
    setName(''); setEmail(''); setMessage('')
    setStatus('idle'); setErrorMsg('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all resize-none'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0d0d1c 0%, #09091a 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-white font-bold text-lg tracking-tight">Contact Support</h2>
                <p className="text-white/40 text-xs mt-0.5">We'll reply to your email within 24 hours</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === 'success' ? (
                <motion.div
                  className="flex flex-col items-center py-8 text-center gap-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-base">Message sent!</p>
                  <p className="text-white/50 text-sm">We'll get back to you at <span className="text-white/70">{email}</span></p>
                  <p className="text-white/30 text-xs mt-1">Or email us directly: <span className="text-cyan-400">support@vybelivechat.com</span></p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: 'rgba(0,212,255,0.18)', border: '1px solid rgba(0,212,255,0.3)' }}
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/60 text-xs font-medium">Your Name</label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className={inputCls}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/60 text-xs font-medium">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/60 text-xs font-medium">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help…"
                      className={inputCls}
                      rows={4}
                      required
                      maxLength={2000}
                    />
                    <p className="text-white/20 text-xs text-right">{message.length}/2000</p>
                  </div>

                  {status === 'error' && (
                    <div className="px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', boxShadow: status === 'sending' ? 'none' : '0 0 24px rgba(0,212,255,0.45)' }}
                    >
                      {status === 'sending' ? 'Sending…' : 'Send Message'}
                    </button>
                    <p className="text-center text-white/25 text-xs">
                      Or email us at{' '}
                      <a
                        href="mailto:support@vybelivechat.com"
                        className="text-cyan-400/70 hover:text-cyan-400 transition-colors"
                      >
                        support@vybelivechat.com
                      </a>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
