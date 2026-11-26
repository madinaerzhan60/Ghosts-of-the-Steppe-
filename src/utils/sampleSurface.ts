import { Vector3, type Mesh, type Object3D, type SkinnedMesh } from 'three'

/**
 * Samples points evenly over the surface of every mesh under `root`, in `root`'s
 * own space. Skinned meshes are sampled in their current pose.
 * Deterministic for a given `rand`.
 */
export function sampleSurface(root: Object3D, count: number, rand: () => number): Float32Array {
  root.updateMatrixWorld(true)
  const rootInverse = root.matrixWorld.clone().invert()

  type Tri = { a: Vector3; b: Vector3; c: Vector3 }
  const tris: Tri[] = []
  const cumulative: number[] = []
  let totalArea = 0
  const ab = new Vector3()
  const ac = new Vector3()

  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.getAttribute('position')
    if (!pos) return
    const skinned = (mesh as SkinnedMesh).isSkinnedMesh ? (mesh as SkinnedMesh) : null
    const toRoot = rootInverse.clone().multiply(mesh.matrixWorld)
    const verts = Array.from({ length: pos.count }, (_, i) => {
      const v = new Vector3().fromBufferAttribute(pos, i)
      if (skinned) skinned.applyBoneTransform(i, v)
      return v.applyMatrix4(toRoot)
    })
    const index = mesh.geometry.getIndex()
    const triCount = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < triCount; t++) {
      const a = verts[index ? index.getX(t * 3) : t * 3]!
      const b = verts[index ? index.getX(t * 3 + 1) : t * 3 + 1]!
      const c = verts[index ? index.getX(t * 3 + 2) : t * 3 + 2]!
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2
      if (!(area > 0)) continue
      totalArea += area
      tris.push({ a, b, c })
      cumulative.push(totalArea)
    }
  })

  const out = new Float32Array(count * 3)
  if (tris.length === 0) return out
  for (let i = 0; i < count; i++) {
    // Pick a triangle in proportion to its area (binary search), then a uniform point in it.
    const target = rand() * totalArea
    let lo = 0
    let hi = cumulative.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cumulative[mid]! < target) lo = mid + 1
      else hi = mid
    }
    const { a, b, c } = tris[lo]!
    let u = rand()
    let v = rand()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    out[i * 3] = a.x + u * (b.x - a.x) + v * (c.x - a.x)
    out[i * 3 + 1] = a.y + u * (b.y - a.y) + v * (c.y - a.y)
    out[i * 3 + 2] = a.z + u * (b.z - a.z) + v * (c.z - a.z)
  }
  return out
}
