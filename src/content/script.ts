import { LANG } from './lang'
import en from './script.en.json' with { type: 'json' }
import ru from './script.ru.json' with { type: 'json' }

/** One spoken line. `audio` is reserved for the voice recording (added later). */
export type ScriptLine = {
  id?: string
  text: string
  /** Required when the line states a fact (facts.md); unsourced facts are never shown. */
  source?: string
  audio?: string
}

type Script = {
  whisper: ScriptLine
  welcome: ScriptLine[]
  case: ScriptLine
  end: ScriptLine
}

/** All spoken / whispered lines, in the visitor's language (English by default). */
export const SCRIPT: Script = (LANG === 'ru' ? ru : en) as Script

export type ScriptLineId = 'case' | 'end'
