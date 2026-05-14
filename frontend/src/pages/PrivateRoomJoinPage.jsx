import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, ArrowLeft, AlertCircle, Video } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'


export default function PrivateRoomJoinPage() {
  const { code }              = useParams()
  const navigate              = useNavigate()
  const { user }              = useAuth()

  const [roomInfo, setRoomInfo] = useState(null)
  const [loadErr,  setLoadErr]  = useState('')
  const [joining,  setJoining]  = useState(false)

  useEffect(() => {
    axios.get(`/api/private/${code?.toUpperCase()}`)
      .then(r => setRoomInfo(r.data))
      .catch(e => setLoadErr(e.response?.data?.error || 'Room not found or expired.'))
  }, [code])

  const handleJoin = () => {
    if (!user) { navigate('/auth'); return }
    setJoining(true)
    navigate('/chat', {
      state: { mode: 'private', privateCode: code?.toUpperCase(), joining: true },
    })
  }

  return (
    <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-vybe-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm relative z-10"
      >
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft size={15} />
          Back to Vybe
        </button>

        <div className="glass-card rounded-2xl p-7">
          {!roomInfo && !loadErr && (
            <div className="text-center py-6">
              <Loader2 size={32} className="text-vybe-purple animate-spin mx-auto mb-3" />
              <p className="text-vybe-muted text-sm">Loading room…</p>
            </div>
          )}

          {loadErr && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h2 className="text-white font-black text-lg mb-2">Room Not Found</h2>
              <p className="text-vybe-muted text-sm mb-6">{loadErr}</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl btn-purple text-white font-bold text-sm">
                Go Home
              </button>
            </div>
          )}

          {roomInfo && (
            <>
              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-vybe-purple-light" />
                </div>
                <h1 className="text-2xl font-black text-white mb-1">Private Room</h1>
                <p className="text-vybe-muted text-[13px] leading-relaxed">
                  You've been invited to a private 1-on-1 video chat on Vybe.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)' }}>
                <div className="w-9 h-9 rounded-xl bg-vybe-purple/20 flex items-center justify-center flex-shrink-0">
                  <Video size={16} className="text-vybe-purple-light" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Private 1-on-1</p>
                  <p className="text-vybe-muted text-[11px]">Only you and the host can join this room</p>
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {joining
                  ? <><Loader2 size={15} className="animate-spin" /> Joining…</>
                  : <><Lock size={15} /> Join Private Room</>}
              </button>

              <p className="text-center text-vybe-muted text-[11px] mt-4">
                Room code: <span className="text-white font-mono font-bold">{code?.toUpperCase()}</span>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
