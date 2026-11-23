export type Choice = "A" | "B";
export type Choices = readonly [Choice, Choice, Choice, Choice];
export type Outcome = { leopard: number; city: number; ibex: number };

type Effect = Outcome;

export type Decision = {
  id: "road" | "resort" | "rangers" | "herder";
  /** A: the harmful or neglectful option. B: the protective option. */
  A: { label: string; effect: Effect };
  B: { label: string; effect: Effect };
};

/** Every score starts here before the decisions are applied. */
export const START: Outcome = { leopard: 0.5, city: 0.5, ibex: 0.5 };

/**
 * Game-balance weights, not facts. Protective choices (B) never lower
 * `leopard` or `ibex` compared with A. `city` is the cost side.
 */
export const DECISIONS: readonly Decision[] = [
  {
    id: "road",
    A: { label: "Road through the gorge", effect: { leopard: -0.2, city: 0.15, ibex: -0.15 } },
    B: { label: "Road around, with a wildlife crossing", effect: { leopard: 0.1, city: 0.05, ibex: 0.1 } },
  },
  {
    id: "resort",
    A: { label: "Ski resort on the ridge", effect: { leopard: -0.2, city: 0.2, ibex: -0.15 } },
    B: { label: "Ridge protected", effect: { leopard: 0.1, city: 0, ibex: 0.1 } },
  },
  {
    id: "rangers",
    A: { label: "Rangers and camera traps not funded", effect: { leopard: -0.1, city: 0.05, ibex: -0.1 } },
    B: { label: "Rangers and camera traps funded", effect: { leopard: 0.1, city: -0.05, ibex: 0.1 } },
  },
  {
    id: "herder",
    A: { label: "Herder left alone", effect: { leopard: -0.15, city: 0, ibex: -0.05 } },
    B: { label: "Predator-proof corrals and compensation", effect: { leopard: 0.1, city: -0.05, ibex: 0.05 } },
  },
];

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
/** Round away float noise so equal choices give identical numbers. */
const tidy = (n: number): number => Math.round(clamp01(n) * 1e6) / 1e6;

/** Pure: the same choices always give the same result. Each value is in 0..1. */
export function applyDecisions(choices: Choices): Outcome {
  const sum = { ...START };
  DECISIONS.forEach((d, i) => {
    const e = d[choices[i]].effect;
    sum.leopard += e.leopard;
    sum.city += e.city;
    sum.ibex += e.ibex;
  });
  return { leopard: tidy(sum.leopard), city: tidy(sum.city), ibex: tidy(sum.ibex) };
}
