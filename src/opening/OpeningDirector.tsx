import { useFrame } from '@react-three/fiber'
import { OPENING } from '../scene/cameraPath'
import { advanceStage, getStage, openingLive } from './openingStore'

/**
 * Moves the welcome forward on scroll progress and on the doors.
 * (Üki's appearance and the dialogue advance it from App.)
 */
export function OpeningDirector() {
  useFrame(() => {
    const stage = getStage()
    const o = openingLive.opening

    if (stage === 'title' && o >= OPENING.titleEnd) advanceStage('walk')
    else if (stage === 'walk' && o >= OPENING.doors - 0.004) advanceStage('arrive')
    else if (stage === 'open' && openingLive.doorOpen >= 0.6) advanceStage('enter')
    else if (stage === 'enter' && o >= OPENING.inside - 0.01) advanceStage('hall')
  })

  return null
}
