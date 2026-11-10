import { useLayoutEffect, useRef } from 'react'
import type { Object3D, SpotLight } from 'three'
import { palette } from '../theme/palette'
import { DOOR, FACADE, WINDOW } from './openingLayout'

const WINDOW_MID_Y = WINDOW.bottom + WINDOW.height / 2

/**
 * Light at the museum doors (the owl scene), all soft and dim:
 * - a cold rim light grazing the facade and doors from the side,
 * - warm glow from the window spilling onto the wall and doors,
 * - a faint warm line of light under the doors (emissive, so it costs no light).
 */
export function MuseumLights() {
  const rim = useRef<SpotLight>(null)
  const rimTarget = useRef<Object3D>(null)
  useLayoutEffect(() => {
    if (rim.current && rimTarget.current) rim.current.target = rimTarget.current
  }, [])

  return (
    <group>
      {/* Cold rim light: from high and far to the side, so it grazes columns and door edges. */}
      <spotLight
        ref={rim}
        position={[9, 7, 5]}
        color={palette.uki}
        intensity={22}
        angle={0.55}
        penumbra={1}
        distance={26}
        decay={1.6}
      />
      <object3D ref={rimTarget} position={[0, DOOR.height / 2, FACADE.depth]} />

      {/* Window glow spilling onto the wall around it and down onto the doors and porch */}
      <pointLight
        position={[0, WINDOW_MID_Y - 0.2, FACADE.depth + 0.9]}
        color={palette.ghost}
        intensity={2.6}
        distance={8}
        decay={2}
      />

      {/* Light under the doors: a thin warm strip just inside, seen in the gap below the leaves */}
      <mesh position={[0, 0.02, 0.05]}>
        <planeGeometry args={[DOOR.width, 0.04]} />
        <meshStandardMaterial color={palette.background} emissive={palette.ghost} emissiveIntensity={1.1} />
      </mesh>
    </group>
  )
}
