import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
      <span className="w-1 h-5 bg-vybe-blue rounded-full inline-block" />
      {title}
    </h2>
    <div className="text-vybe-muted text-[14px] leading-relaxed space-y-2 pl-3">{children}</div>
  </section>
)

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-vybe-bg font-space flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10" style={{ marginTop: '64px' }}>
        {/* Title block */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vybe-blue/10 border border-vybe-blue/20 text-vybe-blue text-xs font-bold mb-4">
            <Shield size={12} />
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-vybe-muted text-sm">
            Effective date: January 1, 2025 &nbsp;·&nbsp; Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-6 sm:p-8">

          <Section title="Acceptance of Terms">
            <p>By accessing or using Vybe ("the Service", "the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Service.</p>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform following any changes constitutes your acceptance of the new terms.</p>
          </Section>

          <Section title="Age Requirement — 18+ Only">
            <p className="text-cyan-400 font-semibold">You must be at least 18 years of age to use Vybe. This is a strict requirement with zero exceptions.</p>
            <p>By using this platform, you represent and warrant that you are 18 years of age or older. If we discover that a user is under 18, we will immediately terminate their account and report the matter to appropriate authorities where required by law.</p>
            <p>Parents and guardians are responsible for monitoring their children's online activity. Vybe is not intended for, nor marketed to, anyone under the age of 18.</p>
          </Section>

          <Section title="Prohibited Content and Conduct">
            <p>Users of Vybe are strictly prohibited from:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Displaying, transmitting, or sharing any nudity, sexually explicit content, or pornographic material</li>
              <li>Engaging in harassment, bullying, threats, or targeted abuse of any other user</li>
              <li>Sharing, soliciting, or distributing child sexual abuse material (CSAM) — violations will be reported to law enforcement immediately</li>
              <li>Engaging in hate speech, discrimination, or content that targets individuals based on race, ethnicity, religion, gender, sexual orientation, or disability</li>
              <li>Impersonating other individuals, celebrities, or entities</li>
              <li>Soliciting personal information from other users, particularly minors</li>
              <li>Using the platform for spam, commercial solicitation, or any unauthorized advertising</li>
              <li>Transmitting malware, viruses, or any code of a destructive nature</li>
              <li>Attempting to bypass, disable, or circumvent any moderation or security features</li>
              <li>Using automated bots or scripts to interact with the Service</li>
            </ul>
          </Section>

          <Section title="User-Generated Content">
            <p>You are solely responsible for all content you transmit through Vybe, including audio, video, and text communications. You retain ownership of your content, but by using the Service you grant Vybe a non-exclusive license to process and transmit that content for the purpose of operating the platform.</p>
            <p>We do not store video streams between users. However, we may log metadata including connection times, report records, and account activity for safety and moderation purposes.</p>
          </Section>

          <Section title="Moderation and Bans">
            <p>Vybe operates a zero-tolerance moderation policy for serious violations. We reserve the right, at our sole discretion, to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Temporarily or permanently suspend any account</li>
              <li>Remove any content that violates these terms</li>
              <li>Automatically suspend accounts that receive 3 or more reports within a 24-hour period, pending admin review</li>
              <li>Permanently ban users for severe violations including CSAM, targeted harassment, or repeat offences</li>
            </ul>
            <p>Ban decisions are made at the sole discretion of Vybe administrators. Banned users may submit an appeal by contacting us at support@vybelivechat.com.</p>
          </Section>

          <Section title="Privacy and Data">
            <p>Your use of Vybe is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of your information as described therein.</p>
            <p>We collect the minimum data necessary to operate the platform safely, including email addresses, usage logs, and report records. We do not sell personal data to third parties.</p>
          </Section>

          <Section title="Membership Services">
            <p>Vybe offers optional paid memberships (Basic and VIP). Memberships are billed monthly and may be cancelled at any time. Refunds are not provided for partial months of service.</p>
            <p>Membership features are subject to change. We reserve the right to modify, suspend, or discontinue any paid feature with reasonable notice.</p>
          </Section>

          <Section title="Disclaimer of Warranties">
            <p>The Service is provided "as is" and "as available" without any warranties of any kind, express or implied. Vybe does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
            <p>Vybe is not responsible for the content, conduct, or communications of any user. We encourage all users to exercise caution and good judgement when interacting with strangers online.</p>
          </Section>

          <Section title="Limitation of Liability">
            <p>To the fullest extent permitted by applicable law, Vybe shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service.</p>
          </Section>

          <Section title="Governing Law">
            <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the competent courts.</p>
          </Section>

          <Section title="Contact">
            <p>If you have questions about these Terms of Service, please contact us at <span className="text-vybe-blue-light">support@vybelivechat.com</span>.</p>
          </Section>

        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-vybe-muted">
          <Link to="/guidelines" className="hover:text-white transition-colors">→ Community Guidelines</Link>
          <Link to="/"           className="hover:text-white transition-colors">→ Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
