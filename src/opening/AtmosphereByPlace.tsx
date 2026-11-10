import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type FogExp2 } from 'three'
import { setWindLevel } from '../audio/ambience'

const OUTSIDE_FOG = 0.034
const INSIDE_FOG = 0.06

/**
 * Lighter fog out on the steppe (so the museum shows through the haze), denser
 * in the hall; full wind outside, a faint draught inside. Blends across the doorway.
 */
export function AtmosphereByPlace() {
  const lastWind = useRef(-1)

  useFrame(({ scene, camera }) => {
    const k = MathUtils.smoothstep(camera.position.z, -2, 3) // 0 inside .. 1 outside
    const fog = scene.fog as FogExp2 | null
    if (fog && 'density' in fog) fog.density = MathUtils.lerp(INSIDE_FOG, OUTSIDE_FOG, k)

    const wind = 0.2 + 0.8 * k
    if (Math.abs(wind - lastWind.current) > 0.03) {
      lastWind.current = wind
      setWindLevel(wind)
    }
  })

  return null
}
