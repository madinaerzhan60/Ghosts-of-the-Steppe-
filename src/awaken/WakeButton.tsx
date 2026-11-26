import { useEffect, useState } from 'react'
import { stageAtLeast, useStage } from '../opening/openingStore'
import { nearestCase } from '../scene/nearestCase'
import { getCaseAnimal } from './animalInfo'
import { getPhase } from './awakeStore'
import { useAwakeSnapshot } from './useAwake'
import { wakeCase } from './wake'
import './awaken.css'

/** The case counts as "in front of the visitor" within this distance, metres. */
const NEAR = 5.5

/**
 * The keyboard and screen reader way to awaken a case: a real button for the case in
 * front of the visitor (Tab to it, Enter or Space). Clicking or tapping the glass works too.
 */
export function WakeButton() {
  const stage = useStage()
  const { active } = useAwakeSnapshot()
  const [near, setNear] = useState<string | null>(null)

  // The nearest case changes every frame in the 3D scene; check it a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNear(nearestCase.distance < NEAR ? nearestCase.id : null)
    }, 200)
    return () => window.clearInterval(id)
  }, [])

  if (!stageAtLeast(stage, 'hall') || active !== null || !near) return null
  const info = getCaseAnimal(near)
  if (!info) return null
  const label = getPhase(near) === 'stone' ? `Awaken: ${info.name}` : `Visit: ${info.name}`

  return (
    <button type="button" className="wake-button" onClick={() => wakeCase(near)}>
      {label}
    </button>
  )
}
