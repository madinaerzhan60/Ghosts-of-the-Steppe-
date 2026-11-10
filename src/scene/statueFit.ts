import { Box3, Group, Vector3, type Mesh, type Object3D, type SkinnedMesh } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { getStoneMaterial } from './stoneMaterial'

export type FitOptions = {
  /**
   * Target width, metres, of the statue's silhouette as the visitor sees it:
   * its extent along `viewAxis` (measured from the real vertices, after the yaw).
   */
  fill: number
  /** Unit x/z axis across the visitor's line of sight (perpendicular to it). */
  viewAxis: { x: number; z: number }
  /** Never taller than this. */
  maxHeight: number
  /** Never wider or deeper than this (world x and z), so it can't touch the glass. */
  maxFootprint: number
  /** Rotate 180° because the head points to -x after alignment. */
  headToMinusX: boolean
  /** Final yaw (radians) applied to a head-along-+x animal. */
  yaw: number
}

export type FittedStatue = {
  object: Group
  /** Width x depth of the rotated, scaled statue (metres), for glass clearance. */
  footprint: { x: number; z: number }
  height: number
}

const size = new Vector3()
const center = new Vector3()

/**
 * Builds a stone statue from a loaded glTF scene:
 * clone (geometry shared; skeleton-aware for skinned meshes) -> stone material ->
 * long axis to x -> centre on its bounding box -> uniform scale -> yaw.
 * The result stands with its feet at y = 0 and its footprint centred on the origin.
 */
export function fitStatue(source: Object3D, opts: FitOptions): FittedStatue {
  const model = cloneSkinned(source)
  const stone = getStoneMaterial()
  model.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    // Shared (cached) geometry: computed once, then reused by every clone.
    if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals()
    mesh.material = stone
    mesh.frustumCulled = false // skinned bounds can be stale; 6 small statues are cheap
  })

  // align: rotates the model so its long horizontal axis is x (head toward +x)
  const align = new Group()
  align.add(model)
  align.updateMatrixWorld(true)
  new Box3().setFromObject(align).getSize(size)
  align.rotation.y = (size.z > size.x ? Math.PI / 2 : 0) + (opts.headToMinusX ? Math.PI : 0)
  align.updateMatrixWorld(true)

  // Centre the aligned model: footprint centred on the origin, feet at y = 0.
  const bounds = new Box3().setFromObject(align)
  bounds.getSize(size)
  bounds.getCenter(center)
  align.position.set(-center.x, -bounds.min.y, -center.z)

  const root = new Group()
  const pivot = new Group()
  pivot.add(align)
  pivot.rotation.y = opts.yaw
  root.add(pivot)
  root.updateMatrixWorld(true)

  // Measure at the model's own size (its original scale is irrelevant), then
  // scale uniformly so the visible silhouette width equals `fill`.
  const box = new Box3().setFromObject(root)
  box.getSize(size)
  // Footprint around the origin (the box may be slightly off-centre after yaw).
  const fx = 2 * Math.max(Math.abs(box.min.x), Math.abs(box.max.x))
  const fz = 2 * Math.max(Math.abs(box.min.z), Math.abs(box.max.z))
  const seen = silhouetteWidth(root, opts.viewAxis)
  const scale = Math.min(
    opts.fill / Math.max(seen, 1e-6),
    opts.maxHeight / Math.max(size.y, 1e-6),
    opts.maxFootprint / Math.max(fx, fz, 1e-6),
  )
  pivot.scale.setScalar(scale)
  root.updateMatrixWorld(true)

  return { object: root, footprint: { x: fx * scale, z: fz * scale }, height: size.y * scale }
}

const v = new Vector3()

/** Extent of the object's vertices along a horizontal axis (world space, current pose). */
function silhouetteWidth(root: Object3D, axis: { x: number; z: number }): number {
  let min = Infinity
  let max = -Infinity
  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.getAttribute('position')
    if (!pos) return
    const skinned = (mesh as SkinnedMesh).isSkinnedMesh ? (mesh as SkinnedMesh) : null
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      if (skinned) skinned.applyBoneTransform(i, v)
      v.applyMatrix4(mesh.matrixWorld)
      const d = v.x * axis.x + v.z * axis.z
      if (d < min) min = d
      if (d > max) max = d
    }
  })
  return Number.isFinite(max - min) ? max - min : 0
}
