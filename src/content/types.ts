export type Lang = "en" | "ru";

export type LocalizedText = Record<Lang, string>;

/** The three states of every animal: stone statue, particle ghost, warm light. */
export type AnimalState = "forgotten" | "returning" | "saved";

export interface Fact {
  year: number;
  text: LocalizedText;
  /** Required. Facts without a source must not be shown. */
  source: string;
}

export interface Fund {
  name: LocalizedText;
  url: string;
}

export interface Animal {
  id: string;
  name: LocalizedText;
  state: AnimalState;
  caseIndex: number;
  facts: Fact[];
  fund: Fund;
}
