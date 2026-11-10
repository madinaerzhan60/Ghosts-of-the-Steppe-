import { test } from "node:test";
import assert from "node:assert/strict";
import rawData from "../src/content/animals.json" with { type: "json" };
import { loadAnimals } from "../src/content/loadAnimals.ts";
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

test("every animal has a fund URL", () => {
  for (const animal of raw) {
    assert.ok(isHttpUrl(animal.fund?.url), `${animal.id}: missing fund URL`);
  }
});

test("all user-facing text exists in en and ru", () => {
  for (const animal of raw) {
    const texts = [animal.name, animal.fund.name, ...animal.facts.map((f) => f.text)];
    for (const t of texts) {
      assert.ok(t.en?.trim() && t.ru?.trim(), `${animal.id}: missing en/ru text`);
    }
  }
});
