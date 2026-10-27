import WindowContext from "./js/WindowContext"
import SceneBouncingBubbles from "./js/scenarios/BouncingBubbles/SceneBouncingBubbles"
import SceneGravityCubes from "./js/scenarios/GravityCubes/SceneGravityCubes"
import { askMotionAccess } from "./js/utils/device/DeviceAccess"

/**
 * BUTTONS
 */

/** motion sensor autorization (iOS) */
document.getElementById("btn-access").addEventListener("click", () => { askMotionAccess() })

/**
 * SCENARIO
 */

/** scenes */
const scene1 = new SceneBouncingBubbles(5, "canvas-scene")
// const scene2 = new SceneGravityCubes(9, "canvas-scene-3d")
const scene3 = new SceneBouncingBubbles(0, "canvas-scene-2")

const ENTRY_MARGIN = 1 // px : la bulle entre juste en deçà du bord, pour ne pas être aussitôt détectée comme sortie

/** main : les canvas ont la même largeur et sont alignés, x est conservé ; y est ramené sur le bord d'entrée (translation) */
const update = () => {
    /** scan bubbles : sorties par le haut (y < −rayon) ou par le bas (y > hauteur + rayon) */
    const outScene1_up_ = scene1.bubbles.filter(b => b.y < -b.radius)
    const outScene1_down_ = scene1.bubbles.filter(b => b.y > scene1.height + b.radius)
    const outScene3_up_ = scene3.bubbles.filter(b => b.y < -b.radius)
    const outScene3_down_ = scene3.bubbles.filter(b => b.y > scene3.height + b.radius)

    /** out scene 1 */
    outScene1_up_.forEach(bubble => {
        scene1.removeBubble(bubble)
        scene3.addBubble(bubble.x, scene3.height + bubble.radius - ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 3 par le bas
    })
    outScene1_down_.forEach(bubble => {
        scene1.removeBubble(bubble)
        scene3.addBubble(bubble.x, -bubble.radius + ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 3 par le haut
    })

    /** out scene 3 */
    outScene3_up_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene1.addBubble(bubble.x, scene1.height + bubble.radius - ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 1 par le bas
    })
    outScene3_down_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene1.addBubble(bubble.x, -bubble.radius + ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 1 par le haut
    })
}
const windowContext = new WindowContext()
const time = windowContext.time
time.on("update", update)
