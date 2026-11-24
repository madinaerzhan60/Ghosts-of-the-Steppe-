import animalsData from "./animals.json" with { type: "json" };
import type { Animal } from "./types.ts";

/** Fallback if an animal has no entry: the warm amber of Üki's eyes. */
const FALLBACK = "#f0b968";

/** The animal's own glow color, from animals.json. */
export function animalColor(animalId: string): string {
  return (animalsData as Animal[]).find((a) => a.id === animalId)?.color ?? FALLBACK;
}
