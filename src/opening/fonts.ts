import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }

// Canvas text (title particles, whispered line, hint) needs the web fonts to be
// loaded first, otherwise the browser silently draws a fallback font.
// Fonts are self-hosted via @fontsource (imported in main.tsx), credited in CREDITS.md.

export const FONT = {
  title: 'Forum', // titles and quotes
  label: '"PT Mono"', // small labels
} as const

let ready: Promise<void> | null = null

export function loadOpeningFonts(): Promise<void> {
  if (!ready) {
    const forumText = opening.title[LANG] + opening.whisper[LANG]
    const monoText = opening.hint[LANG] + opening.tap[LANG]
    ready = Promise.all([
      document.fonts.load(`96px ${FONT.title}`, forumText),
      document.fonts.load(`48px ${FONT.label}`, monoText),
    ])
      .then(() => undefined)
      // Never block the opening on fonts: fall back to whatever is available.
      .catch(() => undefined)
  }
  return ready
}
