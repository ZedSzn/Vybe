import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Crown, Zap, Globe, Shield, ArrowLeft, Loader2,
  AlertCircle, CheckCircle, X, CreditCard, Calendar,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'
import axios from 'axios'


const PLANS = [
  {
    id:    'basic',
    name:  'Basic',
    price: '£6.99',
    per:   'per month',
    color: '#00D4FF',
    glow:  'rgba(0,212,255,0.3)',
    BadgeIcon: Zap,
    features: [
      { label: 'Gender filter (Male or Female)', included: true  },
      { label: 'Country filter',                 included: false },
      { label: 'Basic badge on profile',         included: true  },
    ],
  },
  {
    id:    'vip',
    name:  'VIP',
    price: '£12.99',
    per:   'per month',
    color: '#00D4FF',
    glow:  'rgba(0,212,255,0.35)',
    BadgeIcon: Crown,
    popular: true,
    features: [
      { label: 'Gender filter (Male or Female)', included: true },
      { label: 'Country filter',                 included: true },
      { label: 'VIP badge on profile',           included: true },
    ],
  },
]

export default function SubscriptionPage() {
  const { user, token, refreshUser, loading: authLoading } = useAuth()
  const navigate                     = useNavigate()
  const [searchParams]               = useSearchParams()

  // Seed from sessionStorage so the page renders immediately on repeat visits
  const _cached = (() => { try { const r = sessionStorage.getItem('vybe_sub'); return r ? JSON.parse(r) : null } catch { return null } })()
  const [sub,        setSub]        = useState(_cached)
  const [loading,    setLoading]    = useState(!_cached)
  const [actionLoad, setActionLoad] = useState('')
  const [error,      setError]      = useState('')
  const [toast,      setToast]      = useState('')

  const success    = searchParams.get('success')
  const cancelled  = searchParams.get('cancelled')
  const successPlan = searchParams.get('plan')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    // If we have cached data, refresh silently in background (no spinner)
    fetchStatus(_cached == null)
  }, [user, authLoading]) // eslint-disable-line

  useEffect(() => {
    if (success) {
      setToast(`🎉 ${successPlan === 'vip' ? 'VIP' : 'Basic'} plan activated! Welcome aboard.`)
      try { sessionStorage.removeItem('vybe_sub') } catch {}
      if (refreshUser) refreshUser()
      navigate('/subscription', { replace: true })
    }
    if (cancelled) {
      setToast('Payment cancelled — no charge was made.')
      navigate('/subscription', { replace: true })
    }
  }, [success, cancelled])

  const fetchStatus = async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const res = await axios.get(`/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data.subscription
      setSub(data)
      try { sessionStorage.setItem('vybe_sub', JSON.stringify(data)) } catch {}
    } catch {
      // not subscribed or error — that's fine
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId) => {
    setActionLoad(planId); setError('')
    try {
      const res = await axios.post(
        `/api/subscription/create`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.data.url) window.location.href = res.data.url
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start checkout. Try again.')
    } finally {
      setActionLoad('')
    }
  }

  const handleCancel = async () => {
    setActionLoad('cancel'); setError('')
    try {
      await axios.post(`/api/subscription/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast('Subscription will cancel at end of billing period.')
      try { sessionStorage.removeItem('vybe_sub') } catch {}
      fetchStatus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel. Try again.')
    } finally {
      setActionLoad('')
    }
  }

  const handleResume = async () => {
    setActionLoad('resume'); setError('')
    try {
      await axios.post(`/api/subscription/resume`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast('Subscription resumed!')
      fetchStatus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume. Try again.')
    } finally {
      setActionLoad('')
    }
  }

  const handleChangePlan = async (planId) => {
    setActionLoad('change'); setError('')
    try {
      await axios.post(
        `/api/subscription/change-plan`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setToast(`Switched to ${planId === 'vip' ? 'VIP' : 'Basic'} plan!`)
      try { sessionStorage.removeItem('vybe_sub') } catch {}
      if (refreshUser) refreshUser()
      fetchStatus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change plan. Try again.')
    } finally {
      setActionLoad('')
    }
  }

  const handlePortal = async () => {
    setActionLoad('portal'); setError('')
    try {
      const res = await axios.post(`/api/subscription/portal`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.url) window.location.href = res.data.url
    } catch (err) {
      setError(err.response?.data?.error || 'Could not open billing portal.')
    } finally {
      setActionLoad('')
    }
  }

  const isActive     = sub?.status === 'active'
  const isPastDue    = sub?.status === 'past_due'
  const isCancelling = sub?.cancelAtPeriodEnd
  const periodEnd    = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className="min-h-screen font-space" style={{ background: '#07090f' }}>
      <style>{`.sub-scroll::-webkit-scrollbar { display: none; }`}</style>
      {/* Stripe redirect overlay */}
      <AnimatePresence>
        {(actionLoad === 'basic' || actionLoad === 'vip' || actionLoad === 'portal') && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
            style={{ background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Loader2 size={40} className="animate-spin" style={{ color: '#00B8E0' }} />
            <p className="text-white font-bold text-base">
              {actionLoad === 'portal' ? 'Opening billing portal…' : 'Opening secure checkout…'}
            </p>
            <p className="text-white/40 text-sm">You'll be redirected to Stripe</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', right: '15%', width: '600px', height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-float"
            style={{ background: '#0d1428', border: '1px solid rgba(0,212,255,0.4)' }}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -16, scale: 0.96 }}
          >
            <CheckCircle size={16} className="text-vybe-purple-light flex-shrink-0" />
            {toast}
            <button onClick={() => setToast('')}><X size={14} className="text-gray-500 hover:text-white" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-24">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: '#888899' }}
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            {isActive ? 'Manage Membership' : 'Upgrade to Membership'}
          </h1>
          <p style={{ color: '#888899' }} className="text-base max-w-md mx-auto">
            {isActive
              ? 'You\'re on a membership plan. Manage your billing below.'
              : 'Unlock gender and country filters.'}
          </p>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-xl text-sm flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {/* Status card skeleton */}
            <Skeleton className="h-28 w-full" rounded="rounded-2xl" />
            {/* Plan cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-72" rounded="rounded-2xl" />
              <Skeleton className="h-72" rounded="rounded-2xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Current plan status card */}
            {(isActive || isPastDue) && (
              <motion.div
                className="mb-10 rounded-2xl p-6"
                style={{
                  background: isPastDue
                    ? 'rgba(239,68,68,0.07)'
                    : isCancelling ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.07)',
                  border: isPastDue
                    ? '1px solid rgba(239,68,68,0.2)'
                    : isCancelling ? '1px solid rgba(0,212,255,0.15)' : '1px solid rgba(0,212,255,0.2)',
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {sub.plan === 'vip' ? <Crown size={18} className="text-cyan-400" /> : <Zap size={18} style={{ color: '#00D4FF' }} />}
                      <span className="text-lg font-black text-white">
                        {sub.plan === 'vip' ? 'VIP' : 'Basic'} Plan
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: isPastDue ? 'rgba(239,68,68,0.15)' : isCancelling ? 'rgba(0,212,255,0.12)' : 'rgba(74,222,128,0.15)',
                          color: isPastDue ? '#f87171' : isCancelling ? '#00B8E0' : '#4ade80',
                        }}>
                        {isPastDue ? 'Past Due' : isCancelling ? 'Cancelling' : 'Active'}
                      </span>
                    </div>
                    {isPastDue && (
                      <p className="text-sm" style={{ color: '#f87171' }}>
                        Payment failed — please update your payment method to keep your plan.
                      </p>
                    )}
                    {isCancelling && periodEnd && (
                      <p className="text-sm" style={{ color: '#00B8E0' }}>
                        Access ends on {periodEnd}. Resume anytime before then.
                      </p>
                    )}
                    {isActive && !isCancelling && periodEnd && (
                      <p className="text-sm" style={{ color: '#888899' }}>
                        <Calendar size={13} className="inline mr-1.5" />
                        Next billing date: <span className="text-white font-semibold">{periodEnd}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isPastDue && (
                      <button
                        onClick={handlePortal}
                        disabled={actionLoad === 'portal'}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                        style={{ background: '#ef4444' }}
                      >
                        {actionLoad === 'portal' ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                        Update Payment
                      </button>
                    )}
                    {isCancelling ? (
                      <button
                        onClick={handleResume}
                        disabled={actionLoad === 'resume'}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                        style={{ background: 'rgba(0,212,255,0.8)', border: '1px solid rgba(0,212,255,0.5)' }}
                      >
                        {actionLoad === 'resume' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Resume Subscription
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handlePortal}
                          disabled={actionLoad === 'portal'}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888899' }}
                        >
                          {actionLoad === 'portal' ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                          Billing Portal
                        </button>
                        {!isPastDue && (
                          <button
                            onClick={handleCancel}
                            disabled={actionLoad === 'cancel'}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                          >
                            {actionLoad === 'cancel' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                            Cancel Plan
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {PLANS.map((plan, i) => {
                const isCurrent  = isActive && sub?.plan === plan.id
                const isOtherSub = isActive && sub?.plan !== plan.id

                return (
                  <motion.div
                    key={plan.id}
                    className="relative rounded-2xl p-6 flex flex-col"
                    style={{
                      background: plan.popular ? 'linear-gradient(160deg,#0e1120 0%,#080c1a 100%)' : 'rgba(255,255,255,0.025)',
                      border: isCurrent
                        ? `2px solid ${plan.color}`
                        : plan.popular ? `1px solid ${plan.color}50` : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: plan.popular ? `0 0 50px ${plan.glow}` : 'none',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black"
                        style={{ background: `linear-gradient(135deg, ${plan.color}, #00B8E0)`, color: '#0a0a0f' }}>
                        BEST VALUE
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black text-white"
                        style={{ background: plan.color }}>
                        CURRENT PLAN
                      </div>
                    )}

                    {/* Plan header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                        <plan.BadgeIcon size={22} style={{ color: plan.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                          <span className="text-xs" style={{ color: '#888899' }}>{plan.per}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map(({ label, included }) => (
                        <li key={label} className="flex items-center gap-2.5 text-sm">
                          {included
                            ? <Check size={15} className="flex-shrink-0" style={{ color: plan.color }} />
                            : <X     size={15} className="flex-shrink-0 opacity-30" style={{ color: '#888899' }} />}
                          <span style={{ color: included ? '#e5e7eb' : '#6b7280', wordSpacing: '0.08em' }}>{label}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isCurrent ? (
                      <div className="w-full py-3 rounded-xl text-center text-sm font-bold"
                        style={{ background: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}30` }}>
                        ✓ Your Current Plan
                      </div>
                    ) : isOtherSub ? (
                      <motion.button
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={!!actionLoad}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: `${plan.color}22`, border: `1px solid ${plan.color}40`, color: plan.color }}
                      >
                        {actionLoad === 'change' ? <Loader2 size={14} className="animate-spin" /> : null}
                        {plan.id === 'vip' ? 'Upgrade to VIP' : 'Downgrade to Basic'}
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={!!actionLoad}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{
                          background: plan.popular
                            ? `linear-gradient(135deg, ${plan.color}, #00B8E0)`
                            : `linear-gradient(135deg, #00D4FF, #00B8E0)`,
                          boxShadow: `0 0 24px ${plan.glow}`,
                        }}
                      >
                        {actionLoad === plan.id ? <Loader2 size={14} className="animate-spin" /> : null}
                        Get {plan.name} — {plan.price}/mo
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Free plan note */}
            {!isActive && (
              <div className="text-center text-sm mb-10" style={{ color: '#888899' }}>
                Free for everyone: unlimited chats, friend requests, coins &amp; gifts — no credit card required.
              </div>
            )}

            {/* Feature comparison */}
            <div className="overflow-x-auto sub-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <motion.div
              className="rounded-2xl overflow-hidden min-w-[380px]"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <div className="grid grid-cols-4 text-xs font-extrabold uppercase tracking-widest px-5 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#888899' }}>
                <div className="col-span-2">Feature</div>
                <div className="text-center">Basic</div>
                <div className="text-center">VIP</div>
              </div>
              {[
                { label: 'Gender filter',        basic: true,  vip: true  },
                { label: 'Country filter',       basic: false, vip: true  },
                { label: 'Basic badge on profile', basic: true, vip: false },
                { label: 'VIP badge on profile', basic: false, vip: true  },
              ].map(({ label, basic, vip }, i) => (
                <div key={label} className="grid grid-cols-4 items-center px-5 py-3 text-sm"
                  style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <div className="col-span-2 text-gray-300" style={{ wordSpacing: '0.08em' }}>{label}</div>
                  <div className="flex justify-center">
                    {basic
                      ? <Check size={15} style={{ color: '#00D4FF' }} />
                      : <X     size={13} style={{ color: '#374151' }} />}
                  </div>
                  <div className="flex justify-center">
                    {vip
                      ? <Check size={15} style={{ color: '#00D4FF' }} />
                      : <X     size={13} style={{ color: '#374151' }} />}
                  </div>
                </div>
              ))}
            </motion.div>

            </div>

            {/* Security */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 text-sm text-center" style={{ color: '#888899' }}>
              <Shield size={14} className="flex-shrink-0" />
              <span>Secure billing via Stripe · Cancel anytime · No hidden fees</span>
            </div>
          </>
        )}
      </div>

      {!loading && <Footer />}
    </div>
  )
}
