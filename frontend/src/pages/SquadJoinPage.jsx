import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

export default function SquadJoinPage() {
  const { code }                    = useParams()
  const navigate                    = useNavigate()
  const { socket, isConnected }     = useSocket()
  const { user }                    = useAuth()

  const [squadInfo, setSquadInfo]   = useState(null)  // { leaderName, memberCount, expiresAt }
  const [loadErr,   setLoadErr]     = useState('')
  const [joining,   setJoining]     = useState(false)
  const [joinErr,   setJoinErr]     = useState('')

  // Fetch squad info (no auth required)
  useEffect(() => {
    axios.get(`/api/duo/${code}`)
      .then(r => setSquadInfo(r.data))
      .catch(e => setLoadErr(e.response?.data?.error || 'Duo not found or expired.'))
  }, [code])

  // Listen for join result
  useEffect(() => {
    if (!socket) return

    const onJoined = (data) => {
      setJoining(false)
      navigate('/', { state: { squadJoined: data } })
    }
    const onError = ({ message }) => {
      setJoining(false)
      setJoinErr(message)
    }

    socket.on('squad-joined', onJoined)
    socket.on('squad-error',  onError)

    return () => {
      socket.off('squad-joined', onJoined)
      socket.off('squad-error',  onError)
    }
  }, [socket, navigate])

  const handleJoin = () => {
    if (!socket || !isConnected) { setJoinErr('Not connected. Please refresh.'); return }
    setJoining(true)
    setJoinErr('')
    socket.emit('join-squad', { code: code.toUpperCase(), username: user?.username || 'Guest' })
  }

  return (
    <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
      {/* Ambient glow */}
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
          {/* Loading squad info */}
          {!squadInfo && !loadErr && (
            <div className="text-center py-6">
              <Loader2 size={32} className="text-vybe-purple animate-spin mx-auto mb-3" />
              <p className="text-vybe-muted text-sm">Loading duo info…</p>
            </div>
          )}

          {/* Error loading */}
          {loadErr && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h2 className="text-white font-black text-lg mb-2">Duo Not Found</h2>
              <p className="text-vybe-muted text-sm mb-6">{loadErr}</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl btn-purple text-white font-bold text-sm">
                Go Home
              </button>
            </div>
          )}

          {/* Squad info — join UI */}
          {squadInfo && (
            <>
              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-vybe-purple-light" />
                </div>
                <h1 className="text-2xl font-black text-white mb-1">
                  You're invited!
                </h1>
                <p className="text-vybe-muted text-[13px] leading-relaxed">
                  <span className="text-white font-bold">{squadInfo.leaderName}</span> wants you to join their duo on Vybe.
                </p>
              </div>

              {/* Squad preview */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 flex flex-col items-center gap-1.5 p-3 bg-vybe-card2 rounded-xl border border-vybe-border">
                  <div className="w-9 h-9 rounded-full bg-vybe-purple/20 flex items-center justify-center text-vybe-purple-light font-bold text-sm">
                    {squadInfo.leaderName[0]?.toUpperCase()}
                  </div>
                  <span className="text-[11px] text-white font-medium truncate w-full text-center">{squadInfo.leaderName}</span>
                  <span className="text-[9px] text-cyan-400 font-black tracking-widest">LEADER</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1.5 p-3 bg-vybe-card2/40 rounded-xl border border-dashed border-vybe-border">
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-vybe-border flex items-center justify-center">
                    <span className="text-vybe-muted text-lg font-bold">?</span>
                  </div>
                  <span className="text-[11px] text-vybe-muted">You</span>
                </div>
              </div>

              {joinErr && (
                <p className="text-red-400 text-[12px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  {joinErr}
                </p>
              )}

              <button
                onClick={handleJoin}
                disabled={joining || !isConnected}
                className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <><Loader2 size={15} className="animate-spin" /> Joining…</>
                ) : (
                  <><Users size={15} /> Join Duo</>
                )}
              </button>

              <p className="text-center text-vybe-muted text-[11px] mt-4">
                Invite expires in{' '}
                {Math.max(0, Math.ceil((squadInfo.expiresAt - Date.now()) / 60000))} min
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
