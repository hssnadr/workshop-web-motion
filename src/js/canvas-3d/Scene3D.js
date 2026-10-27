import * as THREE from "three"
import DomElement from "../utils/window/DomElement"
import WindowContext from "../WindowContext"

const FIELD_OF_VIEW = 75 // deg, angle de vue vertical
const CAMERA_DISTANCE = 100 // unités three.js

/** même contrat que Scene2D : le WindowContext ne fait aucune différence entre les deux ; la scène three.js, c'est la classe elle-même */
export default class Scene3D extends THREE.Scene {
    constructor(id = "canvas-scene") {
        super()

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

        /** camera par défaut */
        this.camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, this.domElement.aspectRatio, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** renderer : dessine dans le canvas de la scène */
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })

        /** init */
        this.resize()
    }

    get width() { return this.domElement.width }
    get height() { return this.domElement.height }

    /** dessine la scène vue par la caméra : à appeler après la mise à jour des objets */
    render() { this.renderer.render(this, this.camera) }

    /** un pas de simulation : défini par chaque scénario */
    update() {}

    resize() {
        this.domElement.measure()

        /** camera : même rapport largeur / hauteur que le canvas, sinon l'image est déformée */
        this.camera.aspect = this.domElement.aspectRatio
        this.camera.updateProjectionMatrix()

        /** renderer : bitmap = taille affichée × densité de l'écran (false : three.js ne touche pas au CSS) */
        this.renderer.setPixelRatio(this.windowContext.pixelRatio)
        this.renderer.setSize(this.width, this.height, false)
    }

    /** au scroll, seule la position dans la fenêtre change */
    scroll() { this.domElement.measure() }

    /** hooks : entrées diffusées par le WindowContext */
    onDeviceOrientation() {}

    destroy() {
        /** mémoire GPU de tout ce que la scène contient : géométries, matériaux et leurs textures */
        this.traverse(child => {
            if (!child.isMesh) return
            child.geometry.dispose()
            ;[child.material].flat().forEach(material => {
                for (const key in material) {
                    const value_ = material[key]
                    if (value_ && typeof value_.dispose === 'function') value_.dispose()
                }
                material.dispose()
            })
        })

        this.renderer.dispose()
        if (this.debug.isActive) this.debugFolder.destroy()
    }
}
