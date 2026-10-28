import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import WindowContext from "./js/WindowContext"
import SceneBouncingBubbles from "./js/scenarios/BouncingBubbles/SceneBouncingBubbles"
import SceneGravityCubes from "./js/scenarios/GravityCubes/SceneGravityCubes"
import { askMotionAccess } from "./js/utils/device/DeviceAccess"
import { isMobileDevice } from "./js/utils/system"

/**
 * BUTTONS
 */

/** motion sensor autorization (iOS) : le bouton ne s'affiche que sur mobile (tablettes ignorées) ; sinon seulement transparent, il garde sa place */
const btnAccess = document.getElementById("btn-access")
if (!isMobileDevice(true)) btnAccess.classList.add("is-hidden")
btnAccess.addEventListener("click", () => { askMotionAccess() })

/** reload */
// document.getElementById("btn-reload").addEventListener("click", () => { window.location.reload() })

/**
 * SCENARIO
 */

/** modèle du cube (public/ : BASE_URL, et non « / », pour rester valide sous un sous-dossier) : chargé une seule fois, les cubes en reçoivent des clones (asynchrone : on attend le fichier avant de créer les scènes) */
const portalCube = (await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}gltf/portalcube.glb`)).scene

/** scenes */
const scene1 = new SceneBouncingBubbles(12, "canvas-scene")
const scene2 = new SceneGravityCubes(0, "canvas-scene-3d", "btn-access", portalCube)
const scene3 = new SceneBouncingBubbles(0, "canvas-scene-2")

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
        scene3.addBubble(bubble.x, scene3.height + bubble.radius - 1, bubble.vx, bubble.vy) // entre dans la scène 3 par le bas
    })
    outScene1_down_.forEach(bubble => {
        scene1.removeBubble(bubble)
        scene2.addBubble(bubble.x - scene2.width / 2, scene2.height / 2 + scene2.cubeSize / 2 - 1) // entre dans la scène 2 par le haut ; la marge dépend du cube qui entre, pas de la bulle qui sort
    })

    /** out scene 2 */
    outScene2_up_.forEach(cube => {
        scene2.removeBubble(cube)
        scene1.addBubble(cube.position.x + scene2.width / 2, scene1.height + scene1.params.radius - 1) // entre dans la scène 1 par le bas
    })
    outScene2_down_.forEach(cube => {
        scene2.removeBubble(cube)
        scene3.addBubble(cube.position.x + scene2.width / 2, -scene3.params.radius + 1) // entre dans la scène 3 par le haut
    })

    /** out scene 3 */
    outScene3_up_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene2.addBubble(bubble.x - scene2.width / 2, -scene2.height / 2 - scene2.cubeSize / 2 + 1) // entre dans la scène 2 par le bas
    })
    outScene3_down_.forEach(bubble => {
        scene3.removeBubble(bubble)
        scene1.addBubble(bubble.x, -bubble.radius + 1, bubble.vx, bubble.vy) // entre dans la scène 1 par le haut
    })
}
const windowContext = new WindowContext()
const time = windowContext.time
time.on("update", update)
