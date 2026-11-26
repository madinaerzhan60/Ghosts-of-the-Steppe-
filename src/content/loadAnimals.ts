import animalsData from "./animals.json" with { type: "json" };
import type { Animal, Measure } from "./types.ts";

const hasSource = (source: unknown): boolean => typeof source === "string" && source.trim() !== "";

/** Returns all animals. Facts and measures without a source are dropped (never shown). */
export function loadAnimals(): Animal[] {
  const animals = animalsData as Animal[];
  return animals.map((animal) => ({
    ...animal,
    facts: animal.facts.filter((f) => hasSource(f.source)),
    ...(animal.measures && { measures: animal.measures.filter((m) => hasSource(m.source)) }),
  }));
}

/**
 * Protection measures of one animal. Unsourced ones are TODO placeholders:
 * returned only with `includeTodo` (used in dev builds so the layout can be checked).
 */
export function loadMeasures(animalId: string, includeTodo = false): Measure[] {
  const animal = (animalsData as Animal[]).find((a) => a.id === animalId);
  const all = animal?.measures ?? [];
  return includeTodo ? all : all.filter((m) => hasSource(m.source));
}

const isTodo = (text: string) => text.trim().toUpperCase().startsWith("TODO");

/**
 * The line an animal says when it wakes. Lines that are still TODO are never shown
 * to visitors; `includeTodo` (dev builds) shows them so the moment can be checked.
 */
export function loadWakeLine(animalId: string, includeTodo = false): string | null {
  const text = (animalsData as Animal[]).find((a) => a.id === animalId)?.wakeLine?.en?.trim();
  if (!text) return null;
  return isTodo(text) && !includeTodo ? null : text;
}
