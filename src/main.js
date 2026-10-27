import SceneBouncingBubbles from "./js/scenarios/BouncingBubbles/SceneBouncingBubbles"
import { askMotionAccess } from "./js/utils/device/DeviceAccess"

/** motion sensor autorization (iOS) */
document.getElementById("btn-access").addEventListener("click", () => { askMotionAccess() })

/** scenes */
const scene1 = new SceneBouncingBubbles(10, "canvas-scene")
const scene2 = new SceneBouncingBubbles(10, "canvas-scene-2")
