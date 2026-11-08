import { useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { getCameraPose } from './cameraPath'

const pos = new Vector3()
const target = new Vector3()

export function CameraRig() {
  const scroll = useScroll()

  useFrame(({ camera }) => {
    getCameraPose(scroll.offset, pos, target)
    camera.position.copy(pos)
    camera.lookAt(target)
  })

  return null
}
