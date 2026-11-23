import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { applyDecisions, type Choice, type Choices } from "./decisions.ts";

const choice = fc.constantFrom<Choice>("A", "B");
const choices = fc.tuple(choice, choice, choice, choice) as fc.Arbitrary<Choices>;

test("values always stay in 0..1", () => {
  fc.assert(
    fc.property(choices, (c) => {
      const r = applyDecisions(c);
      for (const v of [r.leopard, r.city, r.ibex]) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
    }),
  );
});

test("more protective choices never make the leopard dimmer", () => {
  fc.assert(
    fc.property(choices, fc.integer({ min: 0, max: 3 }), (c, i) => {
      const better = [...c] as Choice[];
      better[i] = "B";
      assert.ok(applyDecisions(better as unknown as Choices).leopard >= applyDecisions(c).leopard);
    }),
  );
  assert.ok(applyDecisions(["B", "B", "B", "B"]).leopard > applyDecisions(["A", "A", "A", "A"]).leopard);
});

test("same choices always give the same result", () => {
  fc.assert(
    fc.property(choices, (c) => {
      assert.deepEqual(applyDecisions(c), applyDecisions([...c] as unknown as Choices));
    }),
  );
});
