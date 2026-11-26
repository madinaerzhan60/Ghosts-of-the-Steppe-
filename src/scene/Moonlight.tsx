import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type DirectionalLight, type HemisphereLight } from 'three'
import { SKY } from '../opening/openingLayout'
import { palette } from '../theme/palette'

const MOON_POS = SKY.moonDir.clone().multiplyScalar(40)

/**
 * Cold moonlight. The moon hangs low behind the museum, so its light catches the
 * edges, tops and sides of the building (a rim), while a soft sky fill keeps
 * silhouettes, walls, floors and pedestals faintly readable — never pure black.
 * Both dim inside the hall, where the exhibits must be the brightest things.
 */
export function Moonlight() {
  const moon = useRef<DirectionalLight>(null)
  const sky = useRef<HemisphereLight>(null)

  useFrame(({ camera }) => {
    const outside = MathUtils.smoothstep(camera.position.z, -2, 3)
    if (moon.current) moon.current.intensity = MathUtils.lerp(0.2, 0.8, outside)
    if (sky.current) sky.current.intensity = MathUtils.lerp(0.6, 0.5, outside)
  })

  return (
    <>
      <hemisphereLight ref={sky} args={[palette.ridgeFar, palette.background, 0.8]} />
      <directionalLight ref={moon} position={MOON_POS} color={palette.moon} intensity={1.1} />
    </>
  )
}
