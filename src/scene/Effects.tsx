import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { LIGHT_MODE } from '../config/quality'

export function Effects() {
  return (
    <EffectComposer multisampling={LIGHT_MODE ? 0 : 4}>
      <Bloom
        mipmapBlur
        intensity={LIGHT_MODE ? 0.7 : 1.1}
        luminanceThreshold={0.35}
        luminanceSmoothing={0.4}
      />
      <Vignette offset={0.25} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
