import { useCallback, useEffect, useRef, useState } from 'react'
import { SCRIPT, type ScriptLineId } from '../content/script'

// One voice for the one guide. Module-level so it is created once and can be
// mutated freely from callbacks (src, onended) outside React state.
const voiceAudio: HTMLAudioElement | null = typeof Audio === 'undefined' ? null : new Audio()

/** Subtitles are typed letter by letter at this pace (see ui/Subtitles). */
export const SUBTITLE_LETTER_MS = 45

/** Typing + reading time for a line when there is no recording (or it can't autoplay). */
function readingTime(text: string) {
  return text.length * SUBTITLE_LETTER_MS + Math.max(2500, text.length * 65)
}

/**
 * Plays Üki's lines: subtitle text + optional voice recording.
 * Falls back to a reading-time timer when there is no audio or autoplay is blocked,
 * so everything works with sound off.
 */
export function useGuideVoice() {
  const audio = voiceAudio
  const [subtitle, setSubtitle] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const done = useRef<(() => void) | undefined>(undefined)

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    if (audio && !audio.paused) audio.pause()
    setSpeaking(false)
    setSubtitle(null)
    const cb = done.current
    done.current = undefined
    cb?.()
  }, [audio])

  const speak = useCallback(
    (id: ScriptLineId, onDone?: () => void) => {
      const line = SCRIPT[id]
      const text = line.text
      window.clearTimeout(timer.current)
      done.current = onDone
      setSubtitle(text)
      setSpeaking(true)

      const fallback = () => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(stop, readingTime(text))
      }

      const src = line.audio
      if (!audio || !src) return fallback()
      audio.src = src
      audio.onended = () => {
        // Leave the subtitle up a moment after the voice ends.
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(stop, 600)
      }
      audio.play().catch(fallback)
      // Safety net in case `ended` never fires.
      timer.current = window.setTimeout(stop, readingTime(text) + 8000)
    },
    [audio, stop],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { audio, subtitle, speaking, speak }
}
