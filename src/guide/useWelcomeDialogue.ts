import { useEffect, useRef, useState } from 'react'
import { SCRIPT } from '../content/script'
import { advanceStage, getStage, useStage } from '../opening/openingStore'
import { onWalkIntent } from '../walk/walkInput'
import { SUBTITLE_LETTER_MS } from './useGuideVoice'

const LINES = SCRIPT.welcome
/** Ignore intents right after a line appears (the tail of the gesture that called it). */
const SETTLE_MS = 450

/**
 * Üki's three welcome lines at the doors. Each line waits for the visitor:
 * the first click / scroll / key / Next while it is still being typed shows it
 * whole; the next one moves on. After the last line Üki flies to the doors.
 */
export function useWelcomeDialogue() {
  const stage = useStage()
  const [index, setIndex] = useState(0)
  const [revealAll, setRevealAll] = useState(false)
  const shownAt = useRef(0)
  const live = useRef({ index: 0, revealAll: false })

  const active = stage === 'speak'

  // A new line starts its typing clock.
  useEffect(() => {
    if (active) shownAt.current = performance.now()
  }, [active, index])

  useEffect(
    () =>
      onWalkIntent(() => {
        if (getStage() !== 'speak') return
        const now = performance.now()
        const elapsed = now - shownAt.current
        if (elapsed < SETTLE_MS) return
        const l = live.current
        const typing = Array.from(LINES[l.index].text).length * SUBTITLE_LETTER_MS
        if (!l.revealAll && elapsed < typing) {
          l.revealAll = true
          setRevealAll(true)
          return
        }
        if (l.index < LINES.length - 1) {
          l.index += 1
          l.revealAll = false
          shownAt.current = now
          setIndex(l.index)
          setRevealAll(false)
        } else {
          advanceStage('fly')
        }
      }),
    [],
  )

  return {
    active,
    text: active ? LINES[index].text : null,
    lineKey: `welcome-${index}`,
    revealAll,
  }
}
