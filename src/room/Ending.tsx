import { useEffect, useRef } from 'react'
import { loadAnimals, loadMeasures } from '../content/loadAnimals'
import { ROOM_TEXT } from './roomText'

type Props = {
  onAgain: () => void
  /** Back to the hall (only when the room was opened from the hall). */
  onBack?: () => void
}

const E = ROOM_TEXT.ending
const ANIMAL = loadAnimals().find((a) => a.id === 'snow-leopard')
const FACT = ANIMAL?.facts[0]
const FACT_SOURCES = FACT ? [FACT.source, ...(FACT.moreSources ?? [])] : []
/** TODO placeholders are only visible while developing, so visitors never see them. */
const MEASURES = loadMeasures('snow-leopard', import.meta.env.DEV)
const FUND_URL = ANIMAL?.fund?.url

/** "What people really did": the real measures, the real numbers, and what visitors can do. */
export function Ending({ onAgain, onBack }: Props) {
  // Move focus to the panel so screen readers start at its title.
  const section = useRef<HTMLElement>(null)
  useEffect(() => section.current?.focus({ preventScroll: true }), [])

  return (
    <section ref={section} tabIndex={-1} className="room-ending" aria-labelledby="ending-title">
      <h2 id="ending-title" className="room-ending__title">
        {E.title}
      </h2>

      {MEASURES.length > 0 && (
        <ul className="room-ending__measures">
          {MEASURES.map((m) => (
            <li key={m.id}>
              <span>{m.text.en}</span>
              {m.source ? (
                <a href={m.source} target="_blank" rel="noopener noreferrer">
                  {E.sourceLabel}
                </a>
              ) : (
                <span className="room-ending__todo">TODO source</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {FACT && FACT_SOURCES.length > 0 && (
        <div className="room-ending__hope">
          <p className="room-ending__fact">{FACT.text.en}</p>
          <p className="room-ending__chose">{E.choseB}</p>
          <p className="room-ending__sources">
            {FACT_SOURCES.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                {E.sourceLabel} {i + 1}
              </a>
            ))}
          </p>
        </div>
      )}

      <div className="room-ending__buttons">
        {FUND_URL && (
          <a className="room-button room-button--primary" href={FUND_URL} target="_blank" rel="noopener noreferrer">
            {E.keepHere}
          </a>
        )}
        <button type="button" className="room-button room-button--quiet" onClick={onAgain}>
          {E.again}
        </button>
        {onBack && (
          <button type="button" className="room-button room-button--quiet" onClick={onBack}>
            {E.backToHall}
          </button>
        )}
      </div>

      <p className="room-ending__note">{E.note}</p>
    </section>
  )
}
