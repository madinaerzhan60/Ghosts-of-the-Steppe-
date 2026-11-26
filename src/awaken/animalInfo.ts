import { loadAnimals } from '../content/loadAnimals'
import type { Animal, Fact } from '../content/types'
import { CASES } from '../scene/layout'

export type CaseAnimalInfo = {
  id: string
  name: string
  color: string
  /** Up to three facts, each with a source (facts without one are never loaded). */
  facts: Fact[]
}

/** The animal in a case, from animals.json. */
export function getCaseAnimal(caseId: string): CaseAnimalInfo | null {
  const def = CASES.find((c) => c.id === caseId)
  const animal: Animal | undefined = loadAnimals().find((a) => a.id === def?.animal)
  if (!animal) return null
  return { id: animal.id, name: animal.name.en, color: animal.color, facts: animal.facts.slice(0, 3) }
}
