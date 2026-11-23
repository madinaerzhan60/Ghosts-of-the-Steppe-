import { useEffect, useRef } from 'react'
import { DECISION_COUNT, type Choice } from './decisions'
import { ROOM_TEXT } from './roomText'

type Props = {
  /** 0-based index of the decision on screen. */
  index: number
  onChoose: (choice: Choice) => void
}

const CHOICES: readonly Choice[] = ['A', 'B']

/**
 * One decision with its two glowing cards. Works with mouse, touch and keyboard:
 * the cards are real buttons (Tab, Enter, Space), and the keys 1/2 or A/B also pick.
 */
export function DecisionCards({ index, onChoose }: Props) {
  const decision = ROOM_TEXT.decisions[index]!
  const first = useRef<HTMLButtonElement>(null)

  // A new decision starts with the first card focused, so keyboard visitors can go straight on.
  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const key = e.key.toLowerCase()
      if (key === '1' || key === 'a') onChoose('A')
      else if (key === '2' || key === 'b') onChoose('B')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChoose])

  const headingId = `decision-${index}`
  return (
    <section className="room-decision" aria-labelledby={headingId}>
      <p className="room-decision__progress" aria-label={ROOM_TEXT.progress.replace('{n}', String(index + 1)).replace('{total}', String(DECISION_COUNT))}>
        {Array.from({ length: DECISION_COUNT }, (_, i) => (
          <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} aria-hidden="true" />
        ))}
      </p>
      <h2 id={headingId} className="room-decision__prompt">
        {decision.prompt}
      </h2>
      <div className="room-cards" role="group" aria-labelledby={headingId}>
        {CHOICES.map((choice, i) => {
          const text = decision.choices[choice]
          return (
            <button
              key={choice}
              ref={i === 0 ? first : undefined}
              type="button"
              className="room-card"
              onClick={() => onChoose(choice)}
            >
              <span className="room-card__key" aria-hidden="true">
                {choice}
              </span>
              <span className="room-card__title">{text.title}</span>
              <span className="room-card__detail">{text.detail}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
