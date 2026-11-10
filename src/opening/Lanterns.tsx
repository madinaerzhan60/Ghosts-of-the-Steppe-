import { getGlowTexture } from './glowTexture'
import { Lantern } from './Lantern'
import { LANTERNS } from './openingLayout'

/** Oil lanterns along the path to the museum. */
export function Lanterns() {
  const glow = getGlowTexture()
  return (
    <group>
      {LANTERNS.map(([x, z], i) => (
        <Lantern key={i} index={i} x={x} z={z} glowMap={glow} />
      ))}
    </group>
  )
}
