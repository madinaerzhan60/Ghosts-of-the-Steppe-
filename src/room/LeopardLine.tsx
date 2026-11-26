import { useEffect, useState } from 'react'

/** Seconds between the lines of one beat: slow enough to read each one. */
export const LINE_STEP_SECONDS = 3

type Props = {
  /** The lines of the current beat, or null when nobody is speaking. */
  lines: readonly string[] | null
  /** Who speaks: shown as a small label above the lines. */
  speaker: string
  /** "guide" = Üki (ice-blue); otherwise the leopard (amber). */
  tone?: 'leopard' | 'guide'
}

/**
 * Subtitles for one beat of the story: 2-3 short lines that fade in one after another
 * and out slowly. Always on; screen readers get the whole beat when it changes.
 */
export function LeopardLine({ lines, speaker, tone = 'leopard' }: Props) {
  // Keep the last beat in the DOM while it fades out.
  const [shown, setShown] = useState(lines)
  const key = lines?.join('|')
  if (lines && lines.join('|') !== shown?.join('|')) setShown(lines)
  useEffect(() => {
    if (lines) return
    const id = window.setTimeout(() => setShown(null), 1500)
    return () => window.clearTimeout(id)
  }, [lines])

  return (
    <div className={`room-line room-line--${tone}`} role="status" aria-live="polite">
      <div className={lines ? 'room-line__beat is-visible' : 'room-line__beat'} aria-hidden={!lines}>
        {shown && (
          <>
            <span className="room-line__who">{speaker}</span>
            {/* New key = the lines fade in from the start again. */}
            <div key={key ?? shown.join('|')}>
              {shown.map((text, i) => (
                <p key={i} className="room-line__row" style={{ animationDelay: `${i * LINE_STEP_SECONDS}s` }}>
                  “{text}”
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
