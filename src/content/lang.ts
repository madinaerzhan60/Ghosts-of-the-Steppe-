import type { Lang } from './types.ts'

/**
 * UI language. English by default; every text also exists in Russian,
 * available with ?lang=ru.
 */
function detectLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const forced = new URLSearchParams(window.location.search).get('lang')
  return forced === 'ru' ? 'ru' : 'en'
}

export const LANG: Lang = detectLang()
