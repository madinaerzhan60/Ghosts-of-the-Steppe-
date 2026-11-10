import animalsData from "./animals.json" with { type: "json" };
import type { Animal } from "./types.ts";

/** Returns all animals. Facts without a source are dropped (never shown). */
export function loadAnimals(): Animal[] {
  const animals = animalsData as Animal[];
  return animals.map((animal) => ({
    ...animal,
    facts: animal.facts.filter((f) => typeof f.source === "string" && f.source.trim() !== ""),
  }));
}
