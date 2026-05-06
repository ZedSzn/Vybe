import { createContext, useContext, useState } from 'react'
import { t } from '../i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('vybe_lang') || 'en')

  const switchLang = (code) => {
    setLang(code)
    localStorage.setItem('vybe_lang', code)
    document.documentElement.lang = code
    document.documentElement.dir  = code === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <LangContext.Provider value={{ lang, switchLang, t: (key) => t(lang, key) }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}
