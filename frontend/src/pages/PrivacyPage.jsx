import { Link } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import Footer from '../components/Footer'

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
      <span className="w-1 h-5 bg-vybe-purple rounded-full inline-block" />
      {title}
    </h2>
    <div className="text-vybe-muted text-[14px] leading-relaxed space-y-2 pl-3">{children}</div>
  </section>
)

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-vybe-bg font-space flex flex-col">
      {/* Header */}
      <div className="border-b border-vybe-border bg-vybe-bg2/60" style={{ backdropFilter: 'blur(20px)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-vybe-muted hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={15} />
            Back to Vybe
          </Link>
          <div className="text-sm font-black tracking-widest">
            <span className="text-purple-gradient">VY</span>
            <span className="text-white">BE</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Title block */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vybe-purple/10 border border-vybe-purple/20 text-vybe-purple text-xs font-bold mb-4">
            <Lock size={12} />
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-vybe-muted text-sm">
            Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-6 sm:p-8">

          <Section title="Introduction">
            <p>Vybe ("we", "our", or "the Platform") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Vybe random video chat service at vybelivechat.com.</p>
            <p>By using Vybe, you agree to the collection and use of information in accordance with this policy. If you do not agree with any part of this policy, please do not use our service.</p>
          </Section>

          <Section title="Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><span className="text-white font-semibold">Account information</span> — when you register, we collect your username, email address, and a hashed (encrypted) version of your password. We never store plain-text passwords.</li>
              <li><span className="text-white font-semibold">Profile data</span> — optional information you provide, such as your gender and country, used for matching preferences.</li>
              <li><span className="text-white font-semibold">Usage and connection data</span> — connection timestamps, session durations, and matching activity for platform operation and safety.</li>
              <li><span className="text-white font-semibold">Report records</span> — when you submit a report or are reported by another user, we record the reason and associated session data for moderation purposes.</li>
              <li><span className="text-white font-semibold">Payment data</span> — if you purchase a subscription or unban, payment is processed by Stripe. We do not store full card numbers or sensitive payment details. We do store transaction IDs and amounts for our records.</li>
              <li><span className="text-white font-semibold">Technical data</span> — IP addresses, browser type, and device information collected automatically when you use the service.</li>
            </ul>
          </Section>

          <Section title="What We Do NOT Collect">
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>We do <span className="text-white font-semibold">not</span> record, store, or retain video or audio streams between users.</li>
              <li>We do <span className="text-white font-semibold">not</span> read or store the content of text chats between users.</li>
              <li>We do <span className="text-white font-semibold">not</span> sell your personal data to third parties.</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>To operate, maintain, and improve the Vybe platform</li>
              <li>To authenticate you and keep your account secure</li>
              <li>To match you with other users based on your preferences</li>
              <li>To enforce our Terms of Service and Community Guidelines</li>
              <li>To review and act on user reports for safety and moderation</li>
              <li>To process payments for subscriptions and unban purchases</li>
              <li>To send you important service announcements (not marketing) if needed</li>
            </ul>
          </Section>

          <Section title="Cookies and Local Storage">
            <p>Vybe uses cookies and browser local storage for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><span className="text-white font-semibold">Authentication token</span> — we store your JWT login token in localStorage so you remain logged in between sessions. This token expires after 7 days.</li>
              <li><span className="text-white font-semibold">Session cookies</span> — used by our server infrastructure (Socket.io) to maintain your real-time connection.</li>
              <li><span className="text-white font-semibold">Stripe cookies</span> — Stripe may set cookies during the payment process for fraud detection and payment processing. These are governed by Stripe's own privacy policy.</li>
            </ul>
            <p>We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
          </Section>

          <Section title="Third-Party Services">
            <p>Vybe uses the following third-party services that may process your data:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><span className="text-white font-semibold">Stripe</span> — payment processing for subscriptions and unban purchases. Stripe is PCI DSS compliant. See <span className="text-vybe-purple-light">stripe.com/privacy</span> for their privacy policy.</li>
              <li><span className="text-white font-semibold">MongoDB Atlas</span> — cloud database hosting for user accounts, reports, and transaction records. Data is stored with encryption at rest.</li>
              <li><span className="text-white font-semibold">WebRTC / STUN servers</span> — peer-to-peer video connections use public STUN servers (Google, Twilio) to establish connections. These servers see IP addresses but not video content.</li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <p>We retain your data for the following periods:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Account data: retained while your account is active, or until you request deletion</li>
              <li>Report records: retained for 2 years for safety and compliance purposes</li>
              <li>Payment records: retained for 7 years as required by financial regulations</li>
              <li>Connection logs: retained for 30 days, then automatically deleted</li>
            </ul>
          </Section>

          <Section title="Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><span className="text-white font-semibold">Right to access</span> — request a copy of the personal data we hold about you</li>
              <li><span className="text-white font-semibold">Right to rectification</span> — request correction of inaccurate personal data</li>
              <li><span className="text-white font-semibold">Right to erasure</span> — request deletion of your account and associated data (subject to retention requirements)</li>
              <li><span className="text-white font-semibold">Right to portability</span> — request your data in a structured, machine-readable format</li>
              <li><span className="text-white font-semibold">Right to object</span> — object to processing of your personal data in certain circumstances</li>
            </ul>
            <p>To exercise any of these rights, contact us at <span className="text-vybe-purple-light">support@vybelivechat.com</span>.</p>
          </Section>

          <Section title="Children's Privacy">
            <p className="text-red-400 font-semibold">Vybe is strictly for users aged 18 and over. We do not knowingly collect personal data from anyone under 18.</p>
            <p>If we become aware that a user under 18 has provided personal information, we will immediately delete that account and all associated data. If you believe a minor has registered on our platform, please report it to <span className="text-vybe-purple-light">support@vybelivechat.com</span>.</p>
          </Section>

          <Section title="Data Security">
            <p>We implement industry-standard security measures to protect your information, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>All passwords are hashed using bcrypt with salt rounds</li>
              <li>All data transmission is encrypted via HTTPS/TLS</li>
              <li>Authentication tokens are signed using JWT with a secret key</li>
              <li>Database access is restricted to authorised services only</li>
            </ul>
            <p>However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to best practices.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Continued use of Vybe after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="Contact Us">
            <p>
              For privacy-related questions, data requests, or concerns, please contact us at{' '}
              <span className="text-vybe-purple-light">support@vybelivechat.com</span>.
            </p>
          </Section>

        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-vybe-muted">
          <Link to="/terms"      className="hover:text-white transition-colors">→ Terms of Service</Link>
          <Link to="/guidelines" className="hover:text-white transition-colors">→ Community Guidelines</Link>
          <Link to="/"           className="hover:text-white transition-colors">→ Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
