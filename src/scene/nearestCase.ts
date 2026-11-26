// Mutable, non-reactive store: which case is closest to the visitor right now.
// Written every frame by CameraRig, read every frame by the lamps and the "Awaken" button.
export const nearestCase = { id: '', /** metres from the camera to that case (x/z plane) */ distance: Infinity }
