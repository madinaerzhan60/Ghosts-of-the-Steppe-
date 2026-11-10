import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import {
  AdditiveBlending,
  Color,
  Vector3,
  type BufferAttribute,
  type Object3D,
  type ShaderMaterial,
} from 'three'
import { UKI_TRAIL_POINTS } from '../config/quality'
import { palette } from '../theme/palette'
import { trailFragmentShader, trailVertexShader } from './owlShaders'

type Props = {
  /** Object whose world position the trail follows (Üki's flight group). */
  source: RefObject<Object3D | null>
  /** Particles are emitted only while flying. */
  flying: boolean
}

const LIFE = 1.6 // seconds
const RATE = 70 // particles per second while flying
const UNUSED = -1e4

const world = new Vector3()

/** Faint, fading particle trail left behind Üki in flight. World space. */
export function UkiTrail({ source, flying }: Props) {
  const material = useRef<ShaderMaterial>(null)
  const posAttr = useRef<BufferAttribute>(null)
  const birthAttr = useRef<BufferAttribute>(null)
  const emit = useRef({ next: 0, carry: 0 })

  const buffers = useMemo(() => {
    const n = UKI_TRAIL_POINTS
    const rand = new Float32Array(n)
    for (let k = 0; k < n; k++) rand[k] = (k * 0.618034) % 1 // golden-ratio spread, deterministic
    return {
      position: new Float32Array(n * 3),
      birth: new Float32Array(n).fill(UNUSED),
      rand,
    }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLife: { value: LIFE },
      uSize: { value: 0.012 },
      uScale: { value: 400 },
      uColor: { value: new Color(palette.uki) },
    }),
    [],
  )

  useFrame((state, delta) => {
    const u = material.current?.uniforms
    if (!u) return
    const t = state.clock.elapsedTime
    u.uTime.value = t
    u.uScale.value = state.size.height * state.viewport.dpr * 0.5

    const e = emit.current
    if (!flying || !source.current || !posAttr.current || !birthAttr.current) {
      e.carry = 0
      return
    }
    e.carry += Math.min(delta, 0.1) * RATE
    let spawned = 0
    source.current.getWorldPosition(world)
    const n = UKI_TRAIL_POINTS
    const pos = posAttr.current.array as Float32Array
    const birth = birthAttr.current.array as Float32Array
    while (e.carry >= 1) {
      e.carry -= 1
      const k = e.next
      e.next = (e.next + 1) % n
      // Spread across the wingspan, slightly behind the body.
      pos[k * 3] = world.x + (Math.random() - 0.5) * 0.35
      pos[k * 3 + 1] = world.y + (Math.random() - 0.5) * 0.2
      pos[k * 3 + 2] = world.z + (Math.random() - 0.5) * 0.35
      birth[k] = t
      spawned++
    }
    if (spawned > 0) {
      posAttr.current.needsUpdate = true
      birthAttr.current.needsUpdate = true
    }
  })

  return (
    <points frustumCulled={false} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute ref={posAttr} attach="attributes-position" args={[buffers.position, 3]} />
        <bufferAttribute ref={birthAttr} attach="attributes-aBirth" args={[buffers.birth, 1]} />
        <bufferAttribute attach="attributes-aRand" args={[buffers.rand, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={trailVertexShader}
        fragmentShader={trailFragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
