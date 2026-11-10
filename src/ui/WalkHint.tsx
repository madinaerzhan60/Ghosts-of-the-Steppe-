import { useEffect, useState } from 'react'
import { useSoundEnabled } from '../audio/ambience'
import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }
import { useWalkStarted } from '../walk/walkInput'
import './walkHint.css'

/** The hint appears once the title has begun to form. */
const SHOW_AFTER_MS = 2500

/**
 * "scroll to walk" — small, bottom centre of the screen, gently pulsing, so it is
 * never over the museum. Fades away once the visitor starts walking.
 * "tap to begin" sits under it until the first tap turns the sound on.
 */
export function WalkHint() {
  const walking = useWalkStarted()
  const soundOn = useSoundEnabled()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [])

  const visible = ready && !walking
  return (
    <div className={visible ? 'walk-hint is-visible' : 'walk-hint'} aria-hidden={!visible}>
      <p className="walk-hint__main">{opening.hint[LANG]}</p>
      <p className={soundOn ? 'walk-hint__sub' : 'walk-hint__sub is-on'}>{opening.tap[LANG]}</p>
    </div>
  )
}
