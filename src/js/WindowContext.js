import Debug from "./utils/Debug"
import Time from "./utils/Time"

/** singleton : l'instance unique, partagée par toutes les scènes */
let instance = null

const MAX_PIXEL_RATIO = 2 // au-delà, le coût de rendu augmente sans gain visible

export default class WindowContext {
    constructor() {
        if (instance) return instance
        instance = this

        /** scenes : registre de toutes les scènes de la page */
        this.scenes = []

        /** events : un seul écouteur, répercuté à toutes les scènes */
        window.addEventListener('resize', () => { this.resize() })

        /** time : une seule boucle pour toute la page */
        this.time = new Time()
        this.time.on('update', () => { this.update() })

        /** debug */
        this.debug = new Debug()
    }

    addScene(scene) { this.scenes.push(scene) }

    update() { this.scenes.forEach(s => { s.update() }) }
    resize() { this.scenes.forEach(s => { s.resize() }) }

    /** nombre de pixels de l'écran par px CSS (1 sur un écran standard, 2 ou 3 sur un écran haute densité) */
    get pixelRatio() { return Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO) }
}
