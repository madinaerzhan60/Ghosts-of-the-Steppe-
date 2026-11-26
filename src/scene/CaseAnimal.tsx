import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { MathUtils, type Material, type Mesh } from 'three'
import { caseProgress } from '../awaken/caseProgress'
import { useCasePhase } from '../awaken/useAwake'
import { animalColor } from '../content/animalColor'
import { HALL_GHOST_POINTS } from '../config/quality'
import { seededRandom } from '../utils/random'
import { sampleSurface } from '../utils/sampleSurface'
import { AnimalGhost } from './AnimalGhost'
import { MODELS, type ModelId } from './models'
import { fitStatue } from './statueFit'
import { getStoneMaterial } from './stoneMaterial'

type Props = {
  model: ModelId
  caseId: string
  /** Animal id in animals.json: its glow color is the ghost's color. */
  animal: string
  /** Visible silhouette width of the statue, metres (see statueFit). */
  fill: number
  /** Unit x/z axis across the visitor's line of sight. */
  viewAxis: { x: number; z: number }
  maxHeight: number
  /** Max world x/z extent (keeps the statue off the glass). */
  maxFootprint: number
  /** Yaw for a head-along-+x animal (the case decides where it should face). */
  yaw: number
  /** Reports the statue's size so the case can fit its glass around it. */
  onFit?: (size: { x: number; z: number; height: number }) => void
}

/**
 * The animal in its case, in whichever of the three states it is in:
 * a grey-blue stone statue (forgotten), a statue breaking into particles (waking),
 * or a glowing particle ghost in its own color (remembered).
 */
export function CaseAnimal({ model, caseId, animal, fill, viewAxis, maxHeight, maxFootprint, yaw, onFit }: Props) {
  const cfg = MODELS[model]
  const gltf = useGLTF(cfg.url)
  const woken = useCasePhase(caseId) !== 'stone'

  const fitted = useMemo(
    () => fitStatue(gltf.scene, { fill, viewAxis, maxHeight, maxFootprint, yaw, headToMinusX: cfg.headToMinusX }),
    [gltf, fill, viewAxis, maxHeight, maxFootprint, yaw, cfg.headToMinusX],
  )

  useEffect(() => {
    onFit?.({ ...fitted.footprint, height: fitted.height })
  }, [fitted, onFit])

  // The statue's own material, copied once the case wakes so it can fade out
  // (the stone material is shared by every statue, so it must not be touched).
  const fadeMaterial = useMemo(() => {
    if (!woken) return null
    const m = getStoneMaterial().clone()
    m.transparent = true
    fitted.object.traverse((o) => {
      const mesh = o as Mesh
      if (mesh.isMesh) mesh.material = m as Material
    })
    return m
  }, [woken, fitted])

  // The particles come from the model's surface; only built when the case wakes.
  const samples = useMemo(
    () => (woken ? sampleSurface(fitted.object, HALL_GHOST_POINTS, seededRandom(caseId.length * 31 + 5)) : null),
    [woken, fitted, caseId],
  )

  useFrame(() => {
    if (!fadeMaterial) return
    // The solid statue crossfades into particles as it breaks.
    const solid = 1 - MathUtils.smoothstep(caseProgress(caseId).shatter, 0, 0.3)
    fadeMaterial.opacity = solid
    fitted.object.visible = solid > 0.01
  })

  return (
    <>
      <primitive object={fitted.object} />
      {samples && <AnimalGhost caseId={caseId} samples={samples} color={animalColor(animal)} />}
    </>
  )
}
