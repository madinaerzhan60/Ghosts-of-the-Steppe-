import { GROUND_FOG_LAYERS } from '../config/quality'
import { FogSheet } from './FogSheet'

// Three layers at different depths: around the visitor's start, mid-way along the
// path, and up against the museum. (The far horizon haze lives with the mountains.)
const LAYERS = [
  { y: 0.12, opacity: 0.2, seed: 0, z: 14, w: 60, d: 26 },
  { y: 0.5, opacity: 0.16, seed: 3.7, z: 5, w: 40, d: 18 },
  { y: 0.3, opacity: 0.12, seed: 9.1, z: 30, w: 70, d: 22 },
]

/** Drifting ground fog: soft noise sheets at different heights and depths. */
export function GroundFog() {
  return (
    <group>
      {LAYERS.slice(0, GROUND_FOG_LAYERS).map((l) => (
        <FogSheet key={l.seed} {...l} />
      ))}
    </group>
  )
}
