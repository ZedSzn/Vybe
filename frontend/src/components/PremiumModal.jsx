import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Check, Crown, Zap } from 'lucide-react'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '£6.99',
    icon: Zap,
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.3)',
    badge: null,
    features: [
      'Gender filter (Male or Female)',
    ],
    extras: ['Country filter', 'Priority matching', 'VIP badge'],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '£12.99',
    icon: Crown,
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.25)',
    badge: 'BEST VALUE',
    features: [
      'Gender filter (Male or Female)',
      'Country filter',
      'Priority matching',
      'VIP badge on profile',
    ],
    extras: [],
  },
]

export default function PremiumModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  const handlePlan = (planId) => {
    onClose()
    navigate(`/subscription?plan=${planId}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-xl pointer-events-auto font-space"
            >
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
                {/* Header */}
                <div className="relative p-6 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, transparent 60%)' }}>
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: '#888899', background: 'rgba(255,255,255,0.04)' }}
                  >
                    <X size={16} />
                  </button>
                  <div className="text-4xl mb-2">🚀</div>
                  <h2 className="text-2xl font-black text-white mb-1">Upgrade your Vybe</h2>
                  <p className="text-sm" style={{ color: '#888899' }}>
                    Unlock membership filters and meet exactly who you want.
                  </p>
                </div>

                {/* Plans */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANS.map((plan) => {
                    const Icon = plan.icon
                    return (
                      <div
                        key={plan.id}
                        className="relative rounded-xl p-5 flex flex-col"
                        style={{
                          background: plan.badge ? 'linear-gradient(160deg, #0e1120 0%, #080c1a 100%)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${plan.color}${plan.badge ? '60' : '30'}`,
                          boxShadow: plan.badge ? `0 0 32px ${plan.glow}` : 'none',
                        }}
                      >
                        {plan.badge && (
                          <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap tracking-wide text-white"
                            style={{ background: `linear-gradient(135deg, ${plan.color}, #00B8E0)`, color: '#0a0a0f' }}
                          >
                            {plan.badge}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}>
                            <Icon size={14} style={{ color: plan.color }} />
                          </div>
                          <span className="text-sm font-extrabold text-white">{plan.name}</span>
                        </div>

                        <div className="mb-4">
                          <span className="text-3xl font-black text-white">{plan.price}</span>
                          <span className="text-xs ml-1" style={{ color: '#888899' }}>/mo</span>
                        </div>

                        <ul className="space-y-2 mb-5 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[13px] text-gray-300">
                              <Check size={12} className="flex-shrink-0" style={{ color: plan.color }} />
                              {f}
                            </li>
                          ))}
                          {plan.extras.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: '#4b5563' }}>
                              <X size={12} className="flex-shrink-0 opacity-40" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handlePlan(plan.id)}
                          className="w-full py-3 rounded-xl font-extrabold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                          style={{
                            background: plan.badge
                              ? `linear-gradient(135deg, ${plan.color}, #00B8E0)`
                              : `linear-gradient(135deg, #00D4FF, #00B8E0)`,
                            boxShadow: `0 0 20px ${plan.glow}`,
                          }}
                        >
                          Get {plan.name} — {plan.price}/mo
                        </button>
                      </div>
                    )
                  })}
                </div>

                <p className="text-center text-[11px] pb-5" style={{ color: '#4b5563' }}>
                  Cancel anytime · No hidden fees · Secure payment via Stripe
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
