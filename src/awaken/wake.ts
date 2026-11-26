import { animalColor } from '../content/animalColor'
import { loadWakeLine } from '../content/loadAnimals'
import { CASES } from '../scene/layout'
import { startAwake } from './awakeStore'

/**
 * The visitor touched a case (click, tap, or the "Awaken" button).
 * Works for all six cases: the animal, its color and its line come from animals.json.
 */
export function wakeCase(caseId: string): boolean {
  const def = CASES.find((c) => c.id === caseId)
  if (!def) return false
  // Lines still marked TODO are never shown to visitors, only while developing.
  const text = loadWakeLine(def.animal, import.meta.env.DEV)
  return startAwake(caseId, text ? { text, color: animalColor(def.animal) } : null)
}
