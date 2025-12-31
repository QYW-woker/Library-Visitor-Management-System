import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ar from './locales/ar.json'
import zhCN from './locales/zh-CN.json'

// Get saved language or default
function getDefaultLocale() {
  const saved = localStorage.getItem('settings:language')
  if (saved && ['en', 'ar', 'zh-CN'].includes(saved)) {
    return saved
  }
  // Staff H5 defaults to Arabic, Admin defaults to English
  const isAdmin = window.location.pathname.startsWith('/admin')
  return isAdmin ? 'en' : 'ar'
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    ar,
    'zh-CN': zhCN
  }
})

// Language switch function
export function setLanguage(lang) {
  i18n.global.locale.value = lang
  localStorage.setItem('settings:language', lang)
  document.documentElement.setAttribute('lang', lang)
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'zh-CN', name: '简体中文', dir: 'ltr' }
]
