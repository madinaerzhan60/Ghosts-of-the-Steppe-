import { setMuted, useSoundOn } from '../audio/ambience'
import { LANG } from '../content/lang'
import opening from '../content/opening.json' with { type: 'json' }
import './soundButton.css'

/** The only button: a small sound toggle in the corner. Sound is never needed to follow the story. */
export function SoundButton() {
  const on = useSoundOn()
  const label = on ? opening.sound.on[LANG] : opening.sound.off[LANG]

  return (
    <button
      type="button"
      className="sound-button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        setMuted(on)
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {on ? (
          <>
            <path d="M16 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M18.5 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : (
          <path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
