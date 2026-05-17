import { useState } from 'react'
import ProfilePill from '../components/ProfilePill'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <p style={{ color: '#888899', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

export default function ProfilePillDemo() {
  // Parent owns friend state — clicking + flips 'none' → 'pending'.
  const [topStatus, setTopStatus] = useState('none')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '56px 32px', fontFamily: "'Sora', system-ui, sans-serif" }}>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>ProfilePill</h1>
      <p style={{ color: '#888899', fontSize: 13, marginBottom: 40 }}>Glass overlay chip · live + button</p>

      <Section title="Friend states">
        <ProfilePill username="ZZ_NZ" isOnline isVerified friendStatus={topStatus} onAddFriend={() => setTopStatus('pending')} />
        <ProfilePill username="ZZ_NZ" isOnline isVerified friendStatus="pending" />
        <ProfilePill username="ZZ_NZ" isOnline isVerified friendStatus="friends" />
        <ProfilePill username="ZZ_NZ" isOnline isVerified friendStatus="self" />
      </Section>

      <Section title="Avatar fallback · offline · unverified">
        <ProfilePill username="Alex Rivers" isOnline={false} isVerified={false} friendStatus="none" onAddFriend={() => {}} />
        <ProfilePill username="Mia"         isOnline         isVerified={false} friendStatus="none" onAddFriend={() => {}} />
        <ProfilePill username="Sam"         isOnline         isVerified         friendStatus="friends" />
      </Section>

      <Section title="With avatar image">
        <ProfilePill username="ZZ_NZ" avatarUrl="https://placehold.co/80x80/7C3AED/ffffff?text=ZZ"
          isOnline isVerified friendStatus="none" onAddFriend={() => {}} />
        <ProfilePill username="ZZ_NZ" avatarUrl="https://placehold.co/80x80/00D4FF/0a0a0f?text=ZZ"
          isOnline isVerified friendStatus="self" />
      </Section>
    </div>
  )
}
