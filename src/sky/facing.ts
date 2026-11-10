import { Matrix4, Quaternion, Vector3 } from 'three'

const UP = new Vector3(0, 1, 0)
const ORIGIN = new Vector3()

/** Rotation that turns a plane at `p` (sky-dome local) to face the dome centre (the camera). */
export function facingOrigin(p: Vector3): Quaternion {
  return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(ORIGIN, p, UP))
}
