import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'
import { animalColor } from '../content/animalColor'
import { getGlowTexture } from '../opening/glowTexture'
import type { CaseDef } from './layout'

/**
 * A soft pool of the animal's own colored light on the glossy floor in front of its
 * case: the floor "reflects" the case. Local origin = case group.
 */
export function CaseFloorGlow({ def }: { def: CaseDef }) {
  const color = useMemo(() => new Color(animalColor(def.animal)), [def.animal])
  return (
    // Toward the corridor centre, where the visitor stands.
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-def.side * 1.0, 0.015, 0.2]} renderOrder={1}>
      <planeGeometry args={[4.2, 4.2]} />
      <meshBasicMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        opacity={0.26}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
