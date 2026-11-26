export type Lang = "en" | "ru";

/** English is required; Russian is optional. */
export type LocalizedText = { en: string; ru?: string };

/** The three states of every animal: stone statue, particle ghost, warm light. */
export type AnimalState = "forgotten" | "returning" | "saved";

export interface Fact {
  year: number;
  text: LocalizedText;
  /** Required. Facts without a source must not be shown. */
  source: string;
  /** Further sources for the same fact. */
  moreSources?: string[];
}

export interface Fund {
  name: LocalizedText;
  url: string;
}

/** A real protection measure. Shown only when `source` is filled in. */
export interface Measure {
  id: string;
  text: LocalizedText;
  /** Empty = TODO placeholder, never shown to visitors. */
  source: string;
}

export interface Animal {
  id: string;
  name: LocalizedText;
  state: AnimalState;
  caseIndex: number;
  /** The animal's own glow color (#rrggbb): ghost particles, subtitles, plaque, floor light. */
  color: string;
  /** The one line the animal says when it wakes. "TODO..." = not written yet (shown only in dev builds). */
  wakeLine: LocalizedText;
  facts: Fact[];
  /** Optional until a fund is chosen for the animal. */
  fund?: Fund;
  measures?: Measure[];
}
