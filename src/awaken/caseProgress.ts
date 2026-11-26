import { awake, getPhase } from './awakeStore.ts'
import { FULL, NONE, wakeProgress, type Progress } from './timeline.ts'

/**
 * What a case should look like right now: stone cases show nothing of the awakening,
 * awake cases show all of it, and the case that is waking plays the timeline.
 */
export function caseProgress(caseId: string): Progress {
  const phase = getPhase(caseId)
  if (phase === 'stone') return NONE
  if (phase === 'ghost') return FULL
  return awake.active === caseId ? wakeProgress(awake.t) : FULL
}
