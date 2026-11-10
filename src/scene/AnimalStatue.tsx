import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { MODELS, type ModelId } from './models'
import { fitStatue } from './statueFit'

type Props = {
  model: ModelId
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

const announced = new Set<string>()

/** Grey-stone animal statue from a cached GLB, standing at y = 0. */
export function AnimalStatue({ model, fill, viewAxis, maxHeight, maxFootprint, yaw, onFit }: Props) {
  const cfg = MODELS[model]
  const gltf = useGLTF(cfg.url)

  const fitted = useMemo(
    () => fitStatue(gltf.scene, { fill, viewAxis, maxHeight, maxFootprint, yaw, headToMinusX: cfg.headToMinusX }),
    [gltf, fill, viewAxis, maxHeight, maxFootprint, yaw, cfg.headToMinusX],
  )

  useEffect(() => {
    if (announced.has(model)) return
    announced.add(model)
    const names = gltf.animations.map((a) => a.name)
    console.log(`[model] ${model} animations:`, names.length ? names : 'none')
  }, [gltf, model])

  useEffect(() => {
    onFit?.({ ...fitted.footprint, height: fitted.height })
  }, [fitted, onFit])

  return <primitive object={fitted.object} />
}
