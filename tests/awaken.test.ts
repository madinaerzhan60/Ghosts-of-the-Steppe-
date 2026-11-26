import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { nextPhase, phaseRank, type CaseEvent, type CasePhase } from "../src/awaken/caseState.ts";
import { wakeProgress, GLIDE_END, VISIT_END, WAKE_END, type Progress } from "../src/awaken/timeline.ts";
import {
  awake, getPhase, leaveAwake, lineSeconds, resetAwake, startAwake, tickAwake,
} from "../src/awaken/awakeStore.ts";
import { caseProgress } from "../src/awaken/caseProgress.ts";
import { seededRandom } from "../src/utils/random.ts";

const EVENTS: CaseEvent[] = ["wake", "finish"];
const KEYS: (keyof Progress)[] = ["cracks", "glass", "shatter", "gather"];

/** Every sequence of events up to this length (2^10 = 1024 sequences at the top). */
function* sequences(maxLength: number): Generator<CaseEvent[]> {
  let level: CaseEvent[][] = [[]];
  for (let n = 0; n <= maxLength; n++) {
    yield* level;
    level = level.flatMap((s) => EVENTS.map((e) => [...s, e]));
  }
}

test("a case only goes stone -> waking -> ghost, never backwards, for every event sequence", () => {
  for (const events of sequences(10)) {
    let phase: CasePhase = "stone";
    for (const event of events) {
      const next = nextPhase(phase, event);
      assert.ok(phaseRank(next) >= phaseRank(phase), `${events.join(",")}: ${phase} -> ${next}`);
      assert.ok(phaseRank(next) - phaseRank(phase) <= 1, `${events.join(",")}: skipped a phase`);
      phase = next;
    }
  }
});

test("ghost is reachable only through waking", () => {
  assert.equal(nextPhase("stone", "finish"), "stone");
  assert.equal(nextPhase("stone", "wake"), "waking");
  assert.equal(nextPhase("waking", "wake"), "waking");
  assert.equal(nextPhase("waking", "finish"), "ghost");
  assert.equal(nextPhase("ghost", "wake"), "ghost");
  assert.equal(nextPhase("ghost", "finish"), "ghost");
});

test("the timeline stays within 0..1 and never goes backwards in time", () => {
  const rand = seededRandom(7);
  const times = [-5, -0.1, 0, NaN, Infinity, -Infinity, WAKE_END, WAKE_END + 100];
  for (let i = 0; i < 300; i++) times.push(rand() * (WAKE_END + 2));
  for (const t of times) {
    const p = wakeProgress(t);
    for (const k of KEYS) assert.ok(p[k] >= 0 && p[k] <= 1 && Number.isFinite(p[k]), `${t}: ${k}=${p[k]}`);
  }
  let before = wakeProgress(0);
  for (let t = 0; t <= WAKE_END + 1; t += 0.05) {
    const p = wakeProgress(t);
    for (const k of KEYS) assert.ok(p[k] >= before[k], `${k} went backwards at ${t}`);
    before = p;
  }
});

test("the steps run in order: cracks, glass fades, statue breaks, ghost gathers", () => {
  assert.equal(wakeProgress(GLIDE_END).cracks, 0, "no cracks during the camera glide");
  assert.equal(wakeProgress(GLIDE_END + 1).cracks, 1);
  assert.equal(wakeProgress(GLIDE_END + 1).glass, 0, "glass stays until the cracks are done");
  assert.equal(wakeProgress(GLIDE_END + 2).glass, 1);
  assert.equal(wakeProgress(GLIDE_END + 2).shatter, 0, "statue stays until the glass is gone");
  assert.equal(wakeProgress(GLIDE_END + 4).shatter, 1);
  assert.equal(wakeProgress(GLIDE_END + 4).gather, 0, "particles gather after they have drifted out");
  assert.deepEqual(wakeProgress(WAKE_END), { cracks: 1, glass: 1, shatter: 1, gather: 1 });
  assert.ok(Math.abs(GLIDE_END - 1.5) < 1e-9 && WAKE_END > 7 && WAKE_END < 9);
});

beforeEach(() => resetAwake());

const LINE = { text: "Hello.", color: "#9fe8ff" };
const IDS = ["case-1", "case-2", "case-3", "case-4", "case-5", "case-6"];

test("clicking a stone case starts waking and locks the hall; it ends as a ghost with the panel open", () => {
  assert.equal(getPhase("case-3"), "stone");
  assert.equal(startAwake("case-3", LINE), true);
  assert.equal(getPhase("case-3"), "waking");
  assert.equal(awake.active, "case-3");
  tickAwake(WAKE_END - 0.1);
  assert.equal(getPhase("case-3"), "waking");
  assert.equal(awake.panel, false);
  tickAwake(0.2);
  assert.equal(getPhase("case-3"), "ghost");
  assert.equal(awake.panel, true);
  assert.deepEqual(awake.line, LINE, "the animal speaks when the ghost has formed");
});

test("other clicks are ignored while a case is awakening", () => {
  startAwake("case-1", LINE);
  assert.equal(startAwake("case-2", LINE), false);
  assert.equal(getPhase("case-2"), "stone");
  assert.equal(awake.active, "case-1");
});

test("the ghost persists: leaving keeps it, and a later click only visits", () => {
  startAwake("case-3", LINE);
  tickAwake(WAKE_END + 0.1);
  leaveAwake();
  assert.equal(awake.active, null);
  assert.equal(getPhase("case-3"), "ghost");
  assert.deepEqual(caseProgress("case-3"), { cracks: 1, glass: 1, shatter: 1, gather: 1 });
  assert.equal(startAwake("case-3", LINE), true);
  assert.equal(getPhase("case-3"), "ghost", "a visit does not replay the awakening");
  tickAwake(VISIT_END + 0.1);
  assert.equal(awake.panel, true);
});

test("the line fades after its reading time", () => {
  startAwake("case-3", LINE);
  tickAwake(WAKE_END + 0.1);
  assert.ok(awake.line);
  tickAwake(lineSeconds(LINE.text) + 0.1);
  assert.equal(awake.line, null);
  assert.equal(awake.panel, true, "the panel stays after the line is gone");
});

test("random visits: phases never go backwards, one case at a time, the panel only while active", () => {
  const rand = seededRandom(99);
  const rank = new Map<string, number>();
  for (let step = 0; step < 4000; step++) {
    const roll = rand();
    if (roll < 0.2) startAwake(IDS[Math.floor(rand() * IDS.length)]!, rand() < 0.5 ? LINE : null);
    else if (roll < 0.28) leaveAwake();
    else tickAwake(rand() * 2);
    for (const id of IDS) {
      const r = phaseRank(getPhase(id));
      assert.ok(r >= (rank.get(id) ?? 0), `${id} went backwards`);
      rank.set(id, r);
      const p = caseProgress(id);
      for (const k of KEYS) assert.ok(p[k] >= 0 && p[k] <= 1 && Number.isFinite(p[k]));
    }
    const waking = IDS.filter((id) => getPhase(id) === "waking");
    assert.ok(waking.length <= 1, "two cases waking at once");
    if (waking.length === 1) assert.equal(awake.active, waking[0]);
    if (awake.panel) assert.notEqual(awake.active, null);
    if (awake.active === null) assert.equal(waking.length, 0);
  }
});

test("a stone case shows no awakening; a waking case follows the timeline", () => {
  assert.deepEqual(caseProgress("case-1"), { cracks: 0, glass: 0, shatter: 0, gather: 0 });
  startAwake("case-1", null);
  tickAwake(GLIDE_END + 0.5);
  assert.equal(caseProgress("case-1").cracks, 0.5);
  assert.deepEqual(caseProgress("case-2"), { cracks: 0, glass: 0, shatter: 0, gather: 0 });
});
