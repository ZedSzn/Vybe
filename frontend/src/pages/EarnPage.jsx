import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Gift, DollarSign, Zap, Star, Users, TrendingUp, ThumbsUp, Heart, Flame, Gem, Crown } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const HOW_IT_WORKS = [
  {
    icon: <Users size={22} className="text-vybe-purple-light" />,
    title: 'Start a chat session',
    desc: 'Jump into a video chat like normal. Anyone who joins your session can see you live.',
  },
  {
    icon: <Gift size={22} className="text-vybe-purple-light" />,
    title: 'Viewers send you gifts',
    desc: 'Other users send you virtual gifts — roses, stars, diamonds, and more — each worth real money.',
  },
  {
    icon: <DollarSign size={22} className="text-vybe-purple-light" />,
    title: 'Gifts convert to coins',
    desc: 'Every gift lands in your wallet as Vybe Coins. You can cash out once you hit the minimum threshold.',
  },
  {
    icon: <TrendingUp size={22} className="text-vybe-purple-light" />,
    title: 'Grow your earnings',
    desc: 'The more engaging your sessions, the more gifts you receive. Build a following and earn more over time.',
  },
]

const GIFT_TYPES = [
  { Icon: ThumbsUp, name: 'Like',    coins: 10,  label: '10 coins',  color: '#00B8E0' },
  { Icon: Heart,    name: 'Heart',   coins: 25,  label: '25 coins',  color: '#f43f5e' },
  { Icon: Flame,    name: 'Fire',    coins: 50,  label: '50 coins',  color: '#f97316' },
  { Icon: Gem,      name: 'Diamond', coins: 150, label: '150 coins', color: '#06b6d4' },
  { Icon: Crown,    name: 'Crown',   coins: 300, label: '300 coins', color: '#00B8E0' },
]

const FAQS = [
  {
    q: 'How much is each coin worth?',
    a: 'Every 1,000 Vybe Coins = approximately £4.20 at cashout. You keep 70% of all gift value — the remaining 30% covers platform fees.',
  },
  {
    q: 'When can I cash out?',
    a: 'You can request a payout once your Earn Balance reaches 1,000 coins (≈ £4.20). Payouts are processed within 3–5 business days via PayPal.',
  },
  {
    q: 'Do I need a subscription to earn?',
    a: 'No — earning from gifts is available to all users. Having a VIP badge does help attract more viewers and gifts though.',
  },
  {
    q: 'Are there limits on how much I can earn?',
    a: 'There are no earning caps. Top creators on Vybe earn hundreds of pounds per month from regular sessions.',
  },
]

export default function EarnPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen font-space" style={{ background: '#0a0a0f' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute" style={{ top: '-5%', left: '15%', width: '600px', height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 65%)' }} />
        <div className="absolute" style={{ bottom: '10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-28 pb-24">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-10 text-sm font-medium"
        >
          <ArrowLeft size={15} />
          Back to Vybe
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6"
            style={{ background: 'rgba(124,58,237,0.2)', color: 'rgba(167,139,250,0.9)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <Zap size={11} /> Earn on Vybe
          </div>
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            Get paid to<br />
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #00B8E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              live chat
            </span>
          </h1>
          <p className="text-vybe-muted text-base leading-relaxed max-w-md mx-auto">
            When you chat on Vybe, viewers can send you gifts — each one converts into real money in your wallet.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-white font-black text-xl mb-6">How it works</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl flex gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  {step.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">{step.title}</p>
                  <p className="text-vybe-muted text-[13px] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gift types */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mb-12"
        >
          <h2 className="text-white font-black text-xl mb-2">Gifts you can receive</h2>
          <p className="text-vybe-muted text-sm mb-6">Every gift a viewer sends goes straight to your wallet.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {GIFT_TYPES.map((g) => (
              <div
                key={g.name}
                className="flex flex-col items-center gap-2 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${g.color}18`, border: `1px solid ${g.color}30` }}>
                  <g.Icon size={20} style={{ color: g.color }} />
                </div>
                <span className="text-white text-xs font-bold">{g.name}</span>
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(167,139,250,0.8)' }}>{g.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Earnings callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="rounded-2xl p-6 mb-12 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(0,212,255,0.14) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          <Star size={24} className="text-vybe-purple-light mx-auto mb-3" />
          <p className="text-white font-black text-lg mb-1">1,000 coins ≈ £4.20</p>
          <p className="text-vybe-muted text-sm">You keep <span className="text-white font-bold">70%</span> of every gift. No caps. Cash out any time you hit 1,000 coins (≈ £4.20).</p>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-white font-black text-xl mb-6">Common questions</h2>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white font-bold text-sm mb-1.5">{item.q}</p>
                <p className="text-vybe-muted text-[13px] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.36 }}
          className="text-center"
        >
          <p className="text-vybe-muted text-sm mb-4">Ready to start earning?</p>
          <button
            onClick={() => navigate('/chat')}
            className="btn-purple px-8 py-3.5 rounded-xl text-white font-black text-sm"
          >
            Start Chatting & Earning
          </button>
        </motion.div>

      </div>

      <Footer />
    </div>
  )
}
