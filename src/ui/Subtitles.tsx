import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }
import { SUBTITLE_LETTER_MS } from '../guide/useGuideVoice'
import { screenLayout } from './screenLayout'
import './subtitles.css'

type Props = {
  /** Current line, or null when Üki is silent. */
  text: string | null
  /** Show the whole line at once (the visitor asked to skip the typing). */
  revealAll?: boolean
  /** The line waits for the visitor: show a soft "continue" mark once it is typed. */
  awaitInput?: boolean
}

/**
 * Ice-blue subtitles at the bottom of the screen, typed letter by letter like a
 * whisper; fade out slowly. Always on. Screen readers get the whole line at once.
 */
export function Subtitles({ text, revealAll = false, awaitInput = false }: Props) {
  // Keep the last line in the DOM while it fades out.
  const [shown, setShown] = useState(text)
  const [typed, setTyped] = useState(0)
  if (text && text !== shown) {
    setShown(text)
    setTyped(0)
  }

  useEffect(() => {
    if (text) return
    const id = window.setTimeout(() => setShown(null), 1200)
    return () => window.clearTimeout(id)
  }, [text])

  const letters = shown ? Array.from(shown) : []
  const length = letters.length
  const visible = revealAll ? length : typed
  useEffect(() => {
    if (!text || revealAll || typed >= length) return
    const id = window.setTimeout(() => setTyped((n) => n + 1), SUBTITLE_LETTER_MS)
    return () => window.clearTimeout(id)
  }, [text, typed, length, revealAll])

  // Report where the subtitle block starts, so the camera keeps Üki above it.
  const line = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const el = line.current
      if (!el || !shown) return
      const top = el.getBoundingClientRect().top / Math.max(1, window.innerHeight)
      if (Number.isFinite(top)) screenLayout.subtitleTop = top
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [shown])

  const done = !!text && visible >= length
  return (
    <div className="subtitles">
      <p className="visually-hidden" role="status" aria-live="polite">
        {text ? (awaitInput ? `${text} (${opening.continue[LANG]})` : text) : ''}
      </p>
      <p ref={line} className={text ? 'subtitles__line is-visible' : 'subtitles__line'} aria-hidden="true">
        {letters.map((ch, i) => (
          <span key={i} className={i < visible ? 'subtitles__ch is-on' : 'subtitles__ch'}>
            {ch}
          </span>
        ))}
        <span className={awaitInput && done ? 'subtitles__more is-on' : 'subtitles__more'}>›</span>
      </p>
    </div>
  )
}
