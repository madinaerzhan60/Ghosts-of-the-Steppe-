import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  MathUtils,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  type DirectionalLight,
  type Object3D,
  type PointLight,
  type SpotLight,
} from 'three'
import { LIGHT_MODE } from '../config/quality'
import { palette } from '../theme/palette'
import { getGlowTexture } from './glowTexture'
import { DOOR, FACADE, GROUND_Y, PORCH, STEPS, WINDOW } from './openingLayout'
import { openingLive } from './openingStore'

const WINDOW_MID_Y = WINDOW.bottom + WINDOW.height / 2
const SLIT_W = 0.06
const STEPS_RUN = STEPS.count * STEPS.depth
/** Average slope of the steps (the wash is laid along it). */
const SLOPE = Math.atan2(-GROUND_Y, STEPS_RUN)

/**
 * Light at the museum doors (the owl scene), all soft:
 * - a cold rim light grazing the facade and doors from the side,
 * - warm amber from the window, with a soft halo, spilling onto the wall,
 * - a thin warm slit of light between the door leaves, and a warm wash on the
 *   porch and steps that grows as the doors open (emissive and additive planes,
 *   so it costs one small point light at most).
 */
export function MuseumLights() {
  const rim = useRef<SpotLight>(null)
  const rimTarget = useRef<Object3D>(null)
  const spill = useRef<PointLight>(null)
  const fill = useRef<DirectionalLight>(null)
  const fillTarget = useRef<Object3D>(null)
  const slit = useRef<MeshStandardMaterial>(null)
  const washMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: getGlowTexture(),
        color: palette.doorGlow,
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )
  const halo = useRef<MeshBasicMaterial>(null)
  useLayoutEffect(() => {
    if (rim.current && rimTarget.current) rim.current.target = rimTarget.current
    if (fill.current && fillTarget.current) fill.current.target = fillTarget.current
  }, [])

  useFrame(({ clock, camera }) => {
    // Cool fill on the facade, only while the visitor is outside (the hall stays dark).
    if (fill.current) fill.current.intensity = 1.5 * MathUtils.smoothstep(camera.position.z, -1, 3)
    const open = openingLive.doorOpen
    const breathe = 1 + 0.04 * Math.sin(clock.elapsedTime * 1.3) // slow, never a flash
    // Ajar: a thin slit. As the doors swing the slit hides and the wash widens.
    if (slit.current) slit.current.emissiveIntensity = 1.5 * (1 - MathUtils.smoothstep(open, 0, 0.25))
    washMaterial.opacity = (0.5 + 0.35 * open) * breathe
    if (spill.current) spill.current.intensity = (0.5 + 1.4 * open) * breathe
    if (halo.current) halo.current.opacity = 0.55 * breathe
  })

  return (
    <group>
      {/* Cold rim light: from high and far to the side, so it grazes columns and door edges. */}
      <spotLight
        ref={rim}
        position={[9, 7, 5]}
        color={palette.uki}
        intensity={30}
        angle={0.6}
        penumbra={1}
        distance={28}
        decay={1.6}
      />
      {/* Soft front fill: pale moon-blue light from the front-left, so the stone reads. */}
      <directionalLight ref={fill} position={[-5, 6, 20]} color={palette.moon} intensity={1.5} />
      <object3D ref={fillTarget} position={[0, 2.5, FACADE.depth]} />
      <object3D ref={rimTarget} position={[0, DOOR.height / 2, FACADE.depth]} />

      {/* Window glow spilling onto the wall around it and down onto the doors and porch */}
      <pointLight
        position={[0, WINDOW_MID_Y - 0.2, FACADE.depth + 0.9]}
        color={palette.doorGlow}
        intensity={4.2}
        distance={9}
        decay={2}
      />
      {/* Soft halo around the window */}
      <mesh position={[0, WINDOW_MID_Y, FACADE.depth + 0.04]} renderOrder={2}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial
          ref={halo}
          map={getGlowTexture()}
          color={palette.doorGlow}
          transparent
          opacity={0.55}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Warm slit between the door leaves, seen through the gap (hidden once they swing open) */}
      <mesh position={[0, DOOR.height / 2, 0.05]}>
        <planeGeometry args={[SLIT_W, DOOR.height - 0.3]} />
        <meshStandardMaterial ref={slit} color={palette.background} emissive={palette.doorGlow} emissiveIntensity={2.2} />
      </mesh>
      {/* Thin warm strip under the doors */}
      <mesh position={[0, 0.02, 0.05]}>
        <planeGeometry args={[DOOR.width, 0.04]} />
        <meshStandardMaterial color={palette.background} emissive={palette.doorGlow} emissiveIntensity={1.6} />
      </mesh>

      {/* Warm light spilling from the gap over the porch and down the steps */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, FACADE.depth + PORCH.depth / 2 + 0.2]}
        renderOrder={2}
        material={washMaterial}
      >
        <planeGeometry args={[3.6, PORCH.depth + 1.2]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2 + SLOPE, 0, 0]}
        position={[0, GROUND_Y / 2 + 0.04, FACADE.depth + PORCH.depth + STEPS_RUN / 2]}
        renderOrder={2}
        material={washMaterial}
      >
        <planeGeometry args={[3.6, Math.hypot(STEPS_RUN, -GROUND_Y) + 0.4]} />
      </mesh>
      {!LIGHT_MODE && (
        <pointLight
          ref={spill}
          position={[0, 0.5, FACADE.depth + 1.5]}
          color={palette.doorGlow}
          intensity={1.4}
          distance={4}
          decay={2}
        />
      )}
    </group>
  )
}
