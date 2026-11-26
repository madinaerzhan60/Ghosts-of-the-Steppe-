import { AdditiveBlending } from 'three'
import { palette } from '../theme/palette'
import { COLUMNS, FACADE, GROUND_Y, PORCH, STEPS } from './openingLayout'

const HALF = FACADE.width / 2
const D = FACADE.depth
const SLOPE = Math.atan2(FACADE.pedimentRise, HALF)
const SLOPE_LEN = Math.hypot(HALF, FACADE.pedimentRise)
const RISE = -GROUND_Y / STEPS.count

/**
 * Moonlight rim: the moon sits behind the museum, so its light catches only the
 * edges that face the sky or the right-hand side. Drawn as thin, soft, additive
 * strips in cold cyan-white (no real lights, so it costs almost nothing).
 */
export function MuseumRim() {
  const rim = (opacity: number) => (
    <meshBasicMaterial
      color={palette.uki}
      transparent
      opacity={opacity}
      blending={AdditiveBlending}
      depthWrite={false}
    />
  )

  return (
    <group renderOrder={2}>
      {/* Roof: cornice top edge, with a wider faint halo under it */}
      <mesh position={[0, FACADE.top + 0.18, D + 0.2]}>
        <boxGeometry args={[FACADE.width + 0.5, 0.03, 0.6]} />
        {rim(0.6)}
      </mesh>
      <mesh position={[0, FACADE.top + 0.14, D + 0.5]}>
        <boxGeometry args={[FACADE.width + 0.5, 0.1, 0.02]} />
        {rim(0.14)}
      </mesh>
      {/* Pediment edges, both slopes */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[(s * HALF) / 2, FACADE.top + FACADE.pedimentRise / 2 + 0.03, D + 0.02]}
          rotation={[0, 0, -s * SLOPE]}
        >
          <boxGeometry args={[SLOPE_LEN, 0.035, 0.06]} />
          {rim(0.55)}
        </mesh>
      ))}
      {/* Column edges facing the moon (right-hand side of each column) */}
      {COLUMNS.xs.map((x) => (
        <mesh key={x} position={[x + COLUMNS.radius * 0.92, COLUMNS.height / 2, COLUMNS.z]}>
          <boxGeometry args={[0.03, COLUMNS.height - 0.4, 0.05]} />
          {rim(0.32)}
        </mesh>
      ))}
      {/* Step lips and the porch edge */}
      <mesh position={[0, -0.005, D + PORCH.depth - 0.02]}>
        <boxGeometry args={[PORCH.width, 0.025, 0.05]} />
        {rim(0.5)}
      </mesh>
      {Array.from({ length: STEPS.count }, (_, i) => {
        const topY = -(i + 1) * RISE
        const z = D + PORCH.depth + (i + 1) * STEPS.depth - 0.02
        return (
          <mesh key={i} position={[0, topY + 0.005, z]}>
            <boxGeometry args={[STEPS.width + (i + 1) * 0.3, 0.025, 0.05]} />
            {rim(0.42)}
          </mesh>
        )
      })}
    </group>
  )
}
