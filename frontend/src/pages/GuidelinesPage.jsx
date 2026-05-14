import { Link } from 'react-router-dom'
import { ArrowLeft, Heart, ShieldCheck, UserX, AlertTriangle, Ban, Eye } from 'lucide-react'
import Footer from '../components/Footer'

const rules = [
  {
    icon: Heart,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    title: 'Be Respectful',
    body: 'Treat every person you meet on Vybe the way you would want to be treated. Basic human decency is not optional. Rudeness, personal insults, and targeted cruelty will not be tolerated.',
    examples: ['Greet people kindly', 'Disagree without being aggressive', 'Respect when someone ends a chat'],
  },
  {
    icon: Eye,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    title: 'No Nudity or Sexual Content',
    body: 'Vybe is a social platform, not an adult platform. Nudity, sexual acts, and sexually explicit behaviour on camera or in chat are strictly prohibited and will result in an immediate permanent ban.',
    examples: ['Keep clothes on at all times', 'No sexual gestures or language', 'No solicitation of explicit content'],
  },
  {
    icon: UserX,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    title: 'No Minors — 18+ Only',
    body: 'Vybe is exclusively for adults aged 18 and over. If you are under 18, you must not use this platform. If you encounter anyone who appears to be a minor, report them immediately using the Report button.',
    examples: ['You must be 18+ to use Vybe', 'Report anyone who appears underage', 'Do not share content with anyone who may be a minor'],
  },
  {
    icon: AlertTriangle,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-yellow-500/20',
    title: 'No Harassment',
    body: 'Harassment of any kind is prohibited. This includes following users across sessions, sending threatening or demeaning messages, and deliberately targeting individuals.',
    examples: ['No threats or intimidation', 'No persistent unwanted contact', 'No doxxing or sharing of personal information'],
  },
  {
    icon: Ban,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-400/20',
    title: 'No Hate Speech or Discrimination',
    body: 'Content that dehumanises people based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other protected characteristic is not allowed.',
    examples: ['No racial slurs or epithets', 'No calls to violence against any group', 'No symbols or imagery associated with hate groups'],
  },
  {
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    title: 'No Spam or Bots',
    body: 'Automated accounts, bots, and commercial spam are not permitted. Do not use Vybe to promote products, services, or external platforms without permission.',
    examples: ['No automated scripted conversations', 'No advertising or solicitation', 'No fake profiles or impersonation'],
  },
]

const ConsequenceCard = ({ level, title, desc, color, border }) => (
  <div className={`border ${border} rounded-xl p-4 ${color}`}>
    <div className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">{level}</div>
    <div className="font-bold text-white text-sm mb-1">{title}</div>
    <div className="text-[13px] opacity-70">{desc}</div>
  </div>
)

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-vybe-bg font-space flex flex-col">
      {/* Header */}
      <div className="border-b border-vybe-border bg-vybe-bg2/60">
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
        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mb-4">
            <ShieldCheck size={12} />
            Community Standards
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">Community Guidelines</h1>
          <p className="text-vybe-muted text-sm max-w-xl">
            Vybe exists to help real people make genuine connections. These guidelines exist to keep the platform safe, fun, and welcoming for everyone.
          </p>
        </div>

        {/* Rules */}
        <div className="space-y-4 mb-10">
          {rules.map((rule, i) => {
            const Icon = rule.icon
            return (
              <div key={rule.title} className={`border ${rule.border} ${rule.bg} rounded-2xl p-5 sm:p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${rule.bg} border ${rule.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={rule.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-vybe-muted">RULE {i + 1}</span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{rule.title}</h3>
                    <p className="text-vybe-muted text-[13px] leading-relaxed mb-3">{rule.body}</p>
                    <div className="space-y-1">
                      {rule.examples.map((ex) => (
                        <div key={ex} className="flex items-center gap-2 text-[12px] text-vybe-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Consequences */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-black text-white mb-2">Enforcement & Consequences</h2>
          <p className="text-vybe-muted text-[13px] mb-5">
            Vybe uses a combination of user reports and automated systems to enforce these guidelines. Actions are taken at the discretion of our moderation team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ConsequenceCard
              level="First Violation"
              title="Warning / Temporary Suspension"
              desc="Minor violations may result in a warning or 24–72 hour suspension."
              color="text-cyan-400"
              border="border-yellow-500/20"
            />
            <ConsequenceCard
              level="Repeat Violations"
              title="Extended Ban"
              desc="Repeated violations result in longer bans up to 30 days."
              color="text-orange-400"
              border="border-orange-500/20"
            />
            <ConsequenceCard
              level="Severe Violation"
              title="Permanent Ban"
              desc="Nudity, CSAM, hate speech, and severe harassment result in a permanent, irrevocable ban."
              color="text-red-400"
              border="border-red-500/20"
            />
          </div>
        </div>

        {/* Report CTA */}
        <div className="bg-vybe-purple/10 border border-vybe-purple/20 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-white mb-2">See something? Report it.</h2>
          <p className="text-vybe-muted text-[13px] leading-relaxed mb-4">
            Every video chat session includes a Report button. Use it if you see any violation of these guidelines. Reports are reviewed by our moderation team and you will never be identified as the reporter.
          </p>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {['Nudity', 'Harassment', 'Underage User', 'Spam', 'Hate Speech'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-vybe-purple/15 border border-vybe-purple/25 text-vybe-purple font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-white mb-2">Contact &amp; Support</h2>
          <p className="text-vybe-muted text-[13px] leading-relaxed">
            For ban appeals, questions, or safety concerns, reach us at{' '}
            <a href="mailto:support@vybelivechat.com" className="text-vybe-purple-light hover:underline">
              support@vybelivechat.com
            </a>
            . We aim to respond within 24 hours.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-vybe-muted">
          <Link to="/terms" className="hover:text-white transition-colors">→ Terms of Service</Link>
          <Link to="/"      className="hover:text-white transition-colors">→ Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
