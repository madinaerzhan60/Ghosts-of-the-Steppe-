import { Canvas } from '@react-three/fiber'
import { LIGHT_MODE } from './config/quality'
import { Effects } from './scene/Effects'
import { MuseumScene } from './scene/MuseumScene'

export default function App() {
  return (
    <Canvas
      flat
      dpr={LIGHT_MODE ? 1 : [1, 2]}
      camera={{ position: [0, 1.6, -1], fov: 60, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <MuseumScene />
      <Effects />
    </Canvas>
  )
}
