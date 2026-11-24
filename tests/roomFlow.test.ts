import { test } from "node:test";
import assert from "node:assert/strict";
import { flowReducer, INITIAL_FLOW, type Flow } from "../src/room/roomFlow.ts";

test("the story runs prologue -> four seasons -> epilogue -> bridge -> ending", () => {
  let flow: Flow = INITIAL_FLOW;
  assert.equal(flow.phase, "prologue");
  flow = flowReducer(flow, { type: "continue" });
  for (let season = 0; season < 4; season++) {
    assert.equal(flow.phase, "choosing");
    assert.equal(flow.choices.length, season);
    flow = flowReducer(flow, { type: "choose", choice: "B" });
    assert.equal(flow.phase, "reacting");
    flow = flowReducer(flow, { type: "continue" });
  }
  assert.equal(flow.phase, "epilogue");
  flow = flowReducer(flow, { type: "advance" });
  assert.equal(flow.phase, "bridge");
  flow = flowReducer(flow, { type: "advance" });
  assert.equal(flow.phase, "ending");
  assert.deepEqual(flow.choices, ["B", "B", "B", "B"]);
});

test("stray inputs are ignored: a second choice while reacting, advancing early", () => {
  let flow = flowReducer(INITIAL_FLOW, { type: "choose", choice: "A" });
  assert.equal(flow, INITIAL_FLOW, "no choosing in the prologue");
  flow = flowReducer(flowReducer(INITIAL_FLOW, { type: "continue" }), { type: "choose", choice: "A" });
  const again = flowReducer(flow, { type: "choose", choice: "B" });
  assert.deepEqual(again.choices, ["A"]);
  assert.equal(flowReducer(flow, { type: "advance" }), flow);
});

test("restart goes back to the prologue with no choices", () => {
  const flow = flowReducer(flowReducer(INITIAL_FLOW, { type: "continue" }), { type: "choose", choice: "A" });
  assert.deepEqual(flowReducer(flow, { type: "restart" }), INITIAL_FLOW);
});
