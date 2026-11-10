import { useAnnouncement } from '../opening/openingStore'

/** The opening's 3D text, mirrored for screen readers (visually hidden). */
export function OpeningAnnouncer() {
  const text = useAnnouncement()
  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {text}
    </p>
  )
}
