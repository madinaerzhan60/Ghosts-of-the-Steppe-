import { MeshStandardMaterial } from 'three'
import { palette } from '../theme/palette'
import { getStoneNoise } from './stoneNoise'

let cached: MeshStandardMaterial | null = null

/**
 * The one grey-stone material for every statue (placeholders and animal models).
 * Created once and shared; original model colors/textures are ignored.
 */
export function getStoneMaterial(): MeshStandardMaterial {
  if (!cached) {
    cached = new MeshStandardMaterial({
      color: palette.stone,
      roughness: 0.9,
      roughnessMap: getStoneNoise(),
      flatShading: true,
    })
  }
  return cached
}
