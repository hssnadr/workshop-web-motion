import * as THREE from "three"
import DomElement from "../utils/window/DomElement"
import WindowContext from "../WindowContext"

const FIELD_OF_VIEW = 75 // deg, angle de vue vertical
const CAMERA_DISTANCE = 100 // unités three.js

/** même contrat que Scene2D : le WindowContext ne fait aucune différence entre les deux */
export default class Scene3D {
    constructor(id = "canvas-scene") {
        this.id = id

        /** window context : chaque scène s'inscrit au même registre */
        this.windowContext = new WindowContext()
        this.windowContext.addScene(this)

        /** debug : params = seule source de vérité des réglages, un dossier par scène */
        this.params = {}
        this.debug = this.windowContext.debug
        if (this.debug.isActive) this.debugFolder = this.debug.ui.addFolder(id)

        /** canvas */
        this.domElement = new DomElement(id)
        this.canvas = this.domElement.element
        if (this.debug.isActive) this.debugFolder.add(this.domElement, 'isVisible').listen().disable()

        /** scene + camera */
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** renderer : dessine dans le canvas de la scène ; alpha : le canvas a un canal de transparence, le fond est transparent tant que scene.background est vide (clear alpha = 0) */
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true })

        /** pas de resize ici : le scénario l'appelle, une fois son propre état prêt */
    }

    get width() { return this.domElement.width }
    get height() { return this.domElement.height }
    get isVisible() { return this.domElement.isVisible }

    /** densité de rendu : celle de l'écran par défaut ; un scénario peut la remplacer (réglage de qualité) */
    get pixelRatio() { return this.windowContext.pixelRatio }

    /** dessine la scène vue par la caméra : à appeler après la mise à jour des objets */
    render() { this.renderer.render(this.scene, this.camera) }

    /** un pas de simulation : défini par chaque scénario */
    update() {}

    resize() {
        this.domElement.measure()

        /** camera : même rapport largeur / hauteur que le canvas, sinon l'image est déformée */
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

        /** renderer : bitmap = taille affichée × densité de l'écran (false : three.js ne touche pas au CSS) */
        this.renderer.setPixelRatio(this.pixelRatio)
        this.renderer.setSize(this.width, this.height, false)

        /** changer la taille du bitmap l'efface : on redessine */
        this.render()
    }

    /** au scroll, seule la position dans la fenêtre change */
    scroll() { this.domElement.measure() }

    /** hooks : entrées diffusées par le WindowContext */
    onDeviceOrientation() {}
    onDeviceAcceleration() {}
    onSensorsAllowed() {}

    destroy() {
        this.renderer.dispose()
        if (this.debug.isActive) this.debugFolder.destroy()
    }
}
