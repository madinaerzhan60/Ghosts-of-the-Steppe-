import { test } from "node:test";
import assert from "node:assert/strict";
import rawData from "../src/content/animals.json" with { type: "json" };
import { loadAnimals, loadMeasures, loadWakeLine } from "../src/content/loadAnimals.ts";
import type { Animal } from "../src/content/types.ts";

const isHttpUrl = (value: unknown): boolean => {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const raw = rawData as Animal[];

test("there is at least one animal", () => {
  assert.ok(loadAnimals().length > 0);
});

test("every fact has a non-empty source URL", () => {
  for (const animal of raw) {
    for (const fact of animal.facts) {
      assert.ok(isHttpUrl(fact.source), `${animal.id}: bad source for fact ${fact.year}`);
    }
  }
});

test("a fund, when an animal has one, has a URL", () => {
  for (const animal of raw) {
    if (animal.fund) assert.ok(isHttpUrl(animal.fund.url), `${animal.id}: missing fund URL`);
  }
});

test("extra sources of a fact are valid URLs", () => {
  for (const animal of raw) {
    for (const fact of animal.facts) {
      for (const url of fact.moreSources ?? []) assert.ok(isHttpUrl(url), `${animal.id}: bad extra source`);
    }
  }
});

test("measures with a source have a valid URL; empty sources are TODO and never loaded", () => {
  for (const animal of raw) {
    for (const m of animal.measures ?? []) {
      if (m.source.trim() !== "") assert.ok(isHttpUrl(m.source), `${animal.id}/${m.id}: bad source`);
    }
  }
  for (const animal of loadAnimals()) {
    for (const m of animal.measures ?? []) assert.ok(isHttpUrl(m.source), `${animal.id}/${m.id} leaked`);
  }
  assert.equal(loadMeasures("snow-leopard").every((m) => isHttpUrl(m.source)), true);
  assert.equal(loadMeasures("snow-leopard").length, 3, "three sourced measures for the ending");
});

test("all user-facing text exists in English", () => {
  for (const animal of raw) {
    const texts = [animal.name, ...(animal.fund ? [animal.fund.name] : []), ...animal.facts.map((f) => f.text)];
    for (const t of texts) {
      assert.ok(t.en?.trim(), `${animal.id}: missing English text`);
    }
  }
});

test("every animal has its own glow color, and no two animals share one", () => {
  const colors = new Set<string>();
  for (const animal of raw) {
    assert.match(animal.color, /^#[0-9a-f]{6}$/i, `${animal.id}: bad color`);
    colors.add(animal.color.toLowerCase());
  }
  assert.equal(colors.size, raw.length);
});

test("the six hall animals are all there, in case order", () => {
  const ids = [...raw].sort((a, b) => a.caseIndex - b.caseIndex).map((a) => a.id);
  assert.deepEqual(ids, ["turan-tiger", "cheetah", "snow-leopard", "przewalski-horse", "caspian-seal", "saiga"]);
});

test("every animal has a wakeLine in English; TODO lines are hidden from visitors", () => {
  for (const animal of raw) {
    assert.ok(animal.wakeLine?.en?.trim(), `${animal.id}: missing wakeLine`);
    const shown = loadWakeLine(animal.id);
    if (animal.wakeLine.en.trim().toUpperCase().startsWith("TODO")) {
      assert.equal(shown, null, `${animal.id}: a TODO line leaked`);
      assert.equal(loadWakeLine(animal.id, true), animal.wakeLine.en.trim());
    } else {
      assert.equal(shown, animal.wakeLine.en.trim());
    }
  }
});
