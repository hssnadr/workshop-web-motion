import WindowContext from "./js/WindowContext"
import SceneBouncingBubbles from "./js/scenarios/BouncingBubbles/SceneBouncingBubbles"
import SceneGravityCubes from "./js/scenarios/GravityCubes/SceneGravityCubes"
import { askMotionAccess } from "./js/utils/device/DeviceAccess"

/**
 * BUTTONS
 */

/** motion sensor autorization (iOS) */
document.getElementById("btn-access").addEventListener("click", () => { askMotionAccess() })

/** reload */
document.getElementById("btn-reload").addEventListener("click", () => { window.location.reload() })

/**
 * SCENARIO
 */

/** scenes */
const scene1 = new SceneBouncingBubbles(10, "canvas-scene")
const scene2 = new SceneGravityCubes(0, "canvas-scene-3d")
const scene3 = new SceneBouncingBubbles(0, "canvas-scene-2")

const ENTRY_MARGIN = 1 // px : l'objet entre juste en deçà du bord, pour ne pas être aussitôt détecté comme sorti

/**
 * main : les canvas ont la même largeur et sont alignés ; y est ramené sur le bord d'entrée
 * scènes 2D : repère du canvas (origine en haut à gauche, y vers le bas) ; scène 3D : origine au centre, y vers le haut
 */
const update = () => {
    /** scan bubbles */
    const outScene1_up_ = scene1.bubbles.filter(b => b.y < -b.radius)
    const outScene1_down_ = scene1.bubbles.filter(b => b.y > scene1.height + b.radius)

    const outScene2_up_ = scene2.cubes.filter(c => c.position.y > scene2.height / 2 + c.size / 2)
    const outScene2_down_ = scene2.cubes.filter(c => c.position.y < -scene2.height / 2 - c.size / 2)

    const outScene3_up_ = scene3.bubbles.filter(b => b.y < -b.radius)
    const outScene3_down_ = scene3.bubbles.filter(b => b.y > scene3.height + b.radius)

    /** out scene 1 */
    outScene1_up_.forEach(bubble => {
        scene1.removeBubble(bubble)
        scene3.addBubble(bubble.x, scene3.height + bubble.radius - ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 3 par le bas
    })
    outScene1_down_.forEach(bubble => {
        scene1.removeBubble(bubble)
        scene2.addBubble(bubble.x - scene2.width / 2, scene2.height / 2 + bubble.radius - ENTRY_MARGIN) // entre dans la scène 2 par le haut
    })

    /** out scene 2 */
    outScene2_up_.forEach(cube => {
        scene2.removeBubble(cube)
        scene1.addBubble(cube.position.x + scene2.width / 2, scene1.height + cube.size / 2 - ENTRY_MARGIN) // entre dans la scène 1 par le bas
    })
    outScene2_down_.forEach(cube => {
        scene2.removeBubble(cube)
        scene3.addBubble(cube.position.x + scene2.width / 2, -cube.size / 2 + ENTRY_MARGIN) // entre dans la scène 3 par le haut
    })

    /** out scene 3 */
    outScene3_up_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene2.addBubble(bubble.x - scene2.width / 2, -scene2.height / 2 - bubble.radius + ENTRY_MARGIN) // entre dans la scène 2 par le bas
    })
    outScene3_down_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene1.addBubble(bubble.x, -bubble.radius + ENTRY_MARGIN, bubble.vx, bubble.vy) // entre dans la scène 1 par le haut
    })
}
const windowContext = new WindowContext()
const time = windowContext.time
time.on("update", update)
