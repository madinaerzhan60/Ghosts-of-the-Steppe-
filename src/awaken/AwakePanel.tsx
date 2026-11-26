import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getCaseAnimal } from './animalInfo'
import './awaken.css'

type Props = {
  caseId: string
  /** Back to the hall: the camera returns and walking works again. */
  onBack: () => void
  /** Opens the snow leopard's decision room. */
  onEnterRoom: () => void
}

/** Facts still to be written show up in dev builds only, so the layout can be checked. */
const SHOW_TODO = import.meta.env.DEV
const FACT_SLOTS = 3

/**
 * What the visitor can do once an animal has woken:
 *  snow leopard – enter her story (the decision room)
 *  Turan tiger  – "Hear his story" (a placeholder: his room comes next)
 *  the others   – three facts with their sources
 * and always: back to the hall.
 */
export function AwakePanel({ caseId, onBack, onEnterRoom }: Props) {
  const info = getCaseAnimal(caseId)
  const first = useRef<HTMLButtonElement>(null)
  const [note, setNote] = useState<string | null>(null)

  // Keyboard visitors land on the first button; Escape goes back to the hall.
  useEffect(() => {
    first.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack, caseId])

  if (!info) return null
  const showFacts = info.id !== 'snow-leopard' && info.id !== 'turan-tiger'
  const todoSlots = SHOW_TODO ? Math.max(0, FACT_SLOTS - info.facts.length) : 0

  return (
    <section
      className="awake-panel"
      role="dialog"
      aria-labelledby="awake-title"
      style={{ '--animal': info.color } as CSSProperties}
    >
      <h2 id="awake-title" className="awake-panel__title">
        {info.name}
      </h2>

      {showFacts && (info.facts.length > 0 || todoSlots > 0) && (
        <ul className="awake-panel__facts">
          {info.facts.map((fact) => (
            <li key={fact.text.en}>
              <span>{fact.text.en}</span>
              <span className="awake-panel__sources">
                {[fact.source, ...(fact.moreSources ?? [])].map((url, i, all) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {all.length > 1 ? `Source ${i + 1}` : 'Source'}
                  </a>
                ))}
              </span>
            </li>
          ))}
          {Array.from({ length: todoSlots }, (_, i) => (
            <li key={`todo-${i}`} className="awake-panel__todo">
              TODO: fact {info.facts.length + i + 1} (with a source)
            </li>
          ))}
        </ul>
      )}

      <div className="awake-panel__buttons">
        {info.id === 'snow-leopard' && (
          <button ref={first} type="button" className="awake-button awake-button--primary" onClick={onEnterRoom}>
            Enter her story
          </button>
        )}
        {info.id === 'turan-tiger' && (
          <button
            ref={first}
            type="button"
            className="awake-button awake-button--primary"
            onClick={() => setNote('His story is coming soon.')}
          >
            Hear his story
          </button>
        )}
        <button
          ref={showFacts ? first : undefined}
          type="button"
          className="awake-button"
          onClick={onBack}
        >
          Back to the hall
        </button>
      </div>
      <p className="awake-panel__note" role="status">
        {note}
      </p>
    </section>
  )
}
