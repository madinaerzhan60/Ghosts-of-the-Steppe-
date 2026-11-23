import { useEffect, useState } from 'react'
import { ROOM_TEXT } from './roomText'

/**
 * The leopard's current line, as a subtitle. Always on, fades in and out slowly.
 * Read aloud by screen readers when it changes.
 */
export function LeopardLine({ text }: { text: string | null }) {
  // Keep the last line in the DOM while it fades out.
  const [shown, setShown] = useState(text)
  if (text && text !== shown) setShown(text)
  useEffect(() => {
    if (text) return
    const id = window.setTimeout(() => setShown(null), 1300)
    return () => window.clearTimeout(id)
  }, [text])

  return (
    <div className="room-line" role="status" aria-live="polite">
      <p className={text ? 'room-line__quote is-visible' : 'room-line__quote'} aria-hidden={!text}>
        {shown && (
          <>
            <span className="room-line__who">{ROOM_TEXT.speaker}</span>
            <span className="room-line__text">“{shown}”</span>
          </>
        )}
      </p>
    </div>
  )
}
