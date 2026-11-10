import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { Color, HalfFloatType } from 'three'
import { LIGHT_MODE } from '../config/quality'
import { palette } from '../theme/palette'
import { ColorGradeEffect } from './ColorGradeEffect'
import { ExposureEffect } from './ExposureEffect'

/** Exposure before ACES filmic: a little brighter, still a dark night. */
const EXPOSURE = 1.3

export function Effects() {
  const exposure = useMemo(() => new ExposureEffect({ exposure: EXPOSURE }), [])
  useEffect(() => () => exposure.dispose(), [exposure])
  // Deep night blue: the palette's cold fog, deepened (no new hue).
  const grade = useMemo(
    () => new ColorGradeEffect({ night: new Color(palette.fog).lerp(new Color(palette.background), 0.35) }),
    [],
  )
  useEffect(() => () => grade.dispose(), [grade])

  return (
    // HalfFloat buffers: enough range for HDR highlights without float32 overflow quirks.
    // No MSAA: at up to 1.5x pixel ratio it was the single biggest GPU cost
    // (bloom softens the remaining edges).
    <EffectComposer frameBufferType={HalfFloatType} multisampling={0}>
      {/* High threshold: only emissive fixtures, the window and the doorway bloom.
          Computed at half resolution: the glow is blurry anyway. */}
      <Bloom
        mipmapBlur
        levels={4}
        resolutionScale={0.5}
        intensity={LIGHT_MODE ? 0.7 : 1.0}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.2}
      />
      <Vignette offset={0.25} darkness={0.75} />
      <primitive object={exposure} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <primitive object={grade} />
    </EffectComposer>
  )
}
