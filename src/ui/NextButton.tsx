import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }
import { useStage, type Stage } from '../opening/openingStore'
import { walkNext } from '../walk/walkInput'
import './nextButton.css'

/** Moments with nothing to step to (Üki appearing, flying, the doors opening). */
const WAITING: readonly Stage[] = ['arrive', 'fly', 'open']

/**
 * "Next" fallback for trackpads, touch and keyboard: walks to the next resting
 * point, or shows Üki's next line.
 */
export function NextButton() {
  const stage = useStage()
  const hidden = WAITING.includes(stage)

  return (
    <button
      type="button"
      className={hidden ? 'next-button is-hidden' : 'next-button'}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={(e) => {
        e.stopPropagation()
        walkNext()
      }}
    >
      {opening.next[LANG]}
      <span aria-hidden="true"> ›</span>
    </button>
  )
}
