import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContactModal from './ContactModal'

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <footer className="border-t border-vybe-border bg-vybe-bg2/60 font-space">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <nav className="flex items-center gap-x-4 gap-y-1 sm:gap-5 text-[11px] sm:text-[12px] text-vybe-muted flex-wrap justify-center">
            <Link to="/terms"      className="hover:text-white transition-colors whitespace-nowrap">Terms of Service</Link>
            <Link to="/guidelines" className="hover:text-white transition-colors whitespace-nowrap">Community Guidelines</Link>
            <Link to="/privacy"    className="hover:text-white transition-colors whitespace-nowrap">Privacy Policy</Link>
            <button
              onClick={() => setContactOpen(true)}
              className="hover:text-white transition-colors whitespace-nowrap cursor-pointer bg-transparent border-0 p-0 text-[11px] sm:text-[12px] text-vybe-muted font-[inherit]"
            >
              Contact
            </button>
          </nav>
          <p className="text-vybe-muted text-[10.5px] sm:text-[12px] text-center sm:text-right">
            © {new Date().getFullYear()}{' '}
            <Link to="/" className="text-white font-semibold hover:text-cyan-400-light transition-colors">
              Vybe
            </Link>
            . All rights reserved · 18+ only.
          </p>
        </div>
      </footer>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
