import { useEffect, useRef } from 'react'
import { loadAnimals, loadMeasures } from '../content/loadAnimals'
import { ending, level, type RoomState } from './decisions'
import { ROOM_TEXT } from './roomText'

type Props = {
  state: RoomState
  onTryAgain: () => void
  onKeepHere: () => void
}

const E = ROOM_TEXT.ending
/** TODO placeholders are only visible while developing, so visitors never see them. */
/** Sources of the "roughly doubled" fact; the hopeful line is shown only if it has them. */
const HOPE_FACT = loadAnimals().find((a) => a.id === 'snow-leopard')?.facts[0]
const HOPE_SOURCES = HOPE_FACT ? [HOPE_FACT.source, ...(HOPE_FACT.moreSources ?? [])] : []
const MEASURES = loadMeasures('snow-leopard', import.meta.env.DEV)

/** "Your mountains": a calm summary of the slope, the leopard's last line, and what really helps. */
export function Ending({ state, onTryAgain, onKeepHere }: Props) {
  // Move focus to the summary so screen readers start at its title.
  const section = useRef<HTMLElement>(null)
  useEffect(() => section.current?.focus({ preventScroll: true }), [])

  const rows = [
    { label: E.city.label, text: E.city[level(state.city)] },
    { label: E.ibex.label, text: E.ibex[level(state.ibex)] },
    { label: E.leopard.label, text: E.leopard[level(state.leopard)] },
  ]
  return (
    <section ref={section} tabIndex={-1} className="room-ending" aria-labelledby="ending-title">
      <h2 id="ending-title" className="room-ending__title">
        {E.title}
      </h2>

      <h3 className="room-ending__label">{E.slopeHeading}</h3>
      <dl className="room-ending__slope">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>

      <p className="room-ending__final">“{E.finalLine[ending(state)]}”</p>

      {HOPE_SOURCES.length > 0 && (
        <p className="room-ending__hope">
          {E.hopeful}{' '}
          {HOPE_SOURCES.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              {E.sourceLabel} {i + 1}
            </a>
          ))}
        </p>
      )}

      {MEASURES.length > 0 && (
        <>
          <h3 className="room-ending__label">{E.measuresHeading}</h3>
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
        </>
      )}

      <p className="room-ending__note">{E.note}</p>

      <div className="room-ending__buttons">
        <button type="button" className="room-button" onClick={onTryAgain}>
          {E.tryAgain}
        </button>
        <button type="button" className="room-button room-button--quiet" onClick={onKeepHere}>
          {E.keepHere}
        </button>
      </div>
    </section>
  )
}
