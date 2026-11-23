import { test } from "node:test";
import assert from "node:assert/strict";
import { DECISION_COUNT, decide, ending, level, type Choice, type RoomState } from "../src/room/decisions.ts";
import { seededRandom } from "../src/utils/random.ts";

const KEYS: (keyof RoomState)[] = ["leopard", "city", "ibex"];

/** Random choice lists of length 0..4, from a seeded generator (same run every time). */
function* randomChoices(count: number): Generator<Choice[]> {
  const rand = seededRandom(2024);
  for (let n = 0; n < count; n++) {
    const length = Math.floor(rand() * (DECISION_COUNT + 1));
    yield Array.from({ length }, () => (rand() < 0.5 ? "A" : "B"));
  }
}

/** Every list of 0..4 choices (31 in total): the whole input space. */
function allChoices(): Choice[][] {
  const out: Choice[][] = [[]];
  for (const list of out) {
    if (list.length < DECISION_COUNT) out.push([...list, "A"], [...list, "B"]);
  }
  return out;
}

test("the whole input space has 31 cases", () => {
  assert.equal(allChoices().length, 31);
});

test("values always stay within 0..1", () => {
  const inputs = [...allChoices(), ...randomChoices(500), ["B", "B", "B", "B", "B", "B"] as Choice[]];
  for (const choices of inputs) {
    const state = decide(choices);
    for (const key of KEYS) {
      assert.ok(Number.isFinite(state[key]) && state[key] >= 0 && state[key] <= 1, `${choices}: ${key}=${state[key]}`);
    }
  }
});

test("same choices always give the same result", () => {
  for (const choices of [...allChoices(), ...randomChoices(200)]) {
    const copy = [...choices];
    assert.deepEqual(decide(choices), decide(copy));
    assert.deepEqual(choices, copy, "decide must not change its input");
  }
});

test("changing any one choice from A to B never dims the leopard, and never helps the city or hurts the ibex", () => {
  for (const choices of [...allChoices(), ...randomChoices(500)]) {
    choices.forEach((choice, i) => {
      if (choice !== "A") return;
      const better = choices.map((c, j) => (j === i ? "B" : c)) as Choice[];
      const before = decide(choices);
      const after = decide(better);
      assert.ok(after.leopard >= before.leopard, `${choices} -> ${better}: leopard dimmed`);
      assert.ok(after.ibex >= before.ibex, `${choices} -> ${better}: ibex vanished`);
      assert.ok(after.city <= before.city, `${choices} -> ${better}: city crept up`);
    });
  }
});

test("a set of protective choices that contains another never gives a dimmer leopard", () => {
  // Compare every pair of full runs: if B-positions of x are a superset of y's, x is at least as bright.
  const full = allChoices().filter((c) => c.length === DECISION_COUNT);
  for (const x of full) {
    for (const y of full) {
      if (!y.every((c, i) => c !== "B" || x[i] === "B")) continue;
      assert.ok(decide(x).leopard >= decide(y).leopard, `${x} vs ${y}`);
    }
  }
});

test("adding a protective decision never dims the leopard", () => {
  for (const choices of allChoices().filter((c) => c.length < DECISION_COUNT)) {
    assert.ok(decide([...choices, "B"]).leopard >= decide(choices).leopard);
  }
});

test("the extremes: all protective is full, all harmful is empty, none made is neutral", () => {
  assert.deepEqual(decide(["B", "B", "B", "B"]), { leopard: 1, city: 0, ibex: 1 });
  assert.deepEqual(decide(["A", "A", "A", "A"]), { leopard: 0, city: 1, ibex: 0 });
  assert.deepEqual(decide([]), { leopard: 0.5, city: 0.5, ibex: 0.5 });
});

test("every single decision moves all three values (the slope always reacts)", () => {
  for (let i = 0; i < DECISION_COUNT; i++) {
    for (const c of ["A", "B"] as const) {
      const choices: Choice[] = Array.from({ length: i + 1 }, (_, j) => (j === i ? c : "B"));
      const before = decide(choices.slice(0, i));
      const after = decide(choices);
      for (const key of KEYS) assert.notEqual(after[key], before[key], `decision ${i + 1} ${c}: ${key} did not move`);
    }
  }
});

test("extra choices beyond the fourth are ignored", () => {
  assert.deepEqual(decide(["B", "A", "B", "A", "B", "B"]), decide(["B", "A", "B", "A"]));
});

test("level and ending are consistent with the values", () => {
  assert.equal(level(0), "low");
  assert.equal(level(0.5), "mid");
  assert.equal(level(1), "high");
  assert.equal(ending(decide(["B", "B", "B", "B"])), "bright");
  assert.equal(ending(decide(["A", "A", "A", "A"])), "faded");
  // Brighter leopard never gives a worse ending.
  const rank = { faded: 0, bright: 1 } as const;
  for (const x of allChoices()) {
    for (const y of allChoices()) {
      if (decide(x).leopard >= decide(y).leopard) assert.ok(rank[ending(decide(x))] >= rank[ending(decide(y))]);
    }
  }
});
