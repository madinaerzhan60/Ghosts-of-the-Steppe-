import { useGLTF } from '@react-three/drei'

/** Animal models in public/models (see public/models/CREDITS.md). */
export type ModelId = 'tiger' | 'cheetah' | 'snow-leopard' | 'horse' | 'seal' | 'saiga'

export type ModelConfig = {
  url: string
  /**
   * After the long axis is aligned to x, does the head point to -x?
   * (Set per model by looking at it; true = turn it around.)
   */
  headToMinusX: boolean
}

export const MODELS: Record<ModelId, ModelConfig> = {
  tiger: { url: '/models/tiger.glb', headToMinusX: false },
  cheetah: { url: '/models/cheetah.glb', headToMinusX: false },
  'snow-leopard': { url: '/models/snow-leopard.glb', headToMinusX: false },
  horse: { url: '/models/horse.glb', headToMinusX: false },
  seal: { url: '/models/seal.glb', headToMinusX: false },
  saiga: { url: '/models/saiga.glb', headToMinusX: true },
}

// Start downloading as soon as this module is imported, so the files are
// (usually) ready by the time the visitor reaches the cases. Cached by URL.
// A failed preload is reported by ModelErrorBoundary when the statue mounts.
for (const { url } of Object.values(MODELS)) {
  try {
    useGLTF.preload(url)
  } catch {
    /* reported on mount */
  }
}
