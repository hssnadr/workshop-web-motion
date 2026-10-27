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

        /** events : un seul écouteur, répercuté à toutes les scènes ; gardé pour pouvoir le retirer */
        this.handleResize = () => { this.resize() }
        this.handleScroll = () => { this.scroll() }
        window.addEventListener('resize', this.handleResize)
        window.addEventListener('scroll', this.handleScroll)

        /** time : une seule boucle pour toute la page */
        this.time = new Time()
        this.handleUpdate = () => { this.update() }
        this.time.on('update', this.handleUpdate)

        /** debug */
        this.debug = new Debug()
    }

    addScene(scene) { this.scenes.push(scene) }

    /** culling : seules les scènes visibles font un pas */
    update() { this.scenes.forEach(s => { if (s.domElement.isVisible) s.update() }) }

    resize() { this.scenes.forEach(s => { s.resize() }) }
    scroll() { this.scenes.forEach(s => { s.scroll() }) }

    /**
     * DESTROY : défaire tout ce que le constructeur a fait, dans l'ordre inverse
     * (removeEventListener avec une nouvelle flèche ne retirerait rien : ce n'est pas la même fonction)
     */
    destroy() {
        this.scenes.forEach(s => { s.destroy() }) // inscrites en dernier, détruites en premier
        this.scenes = []
        this.debug.destroy()
        this.time.off('update', this.handleUpdate)
        this.time.destroy()
        window.removeEventListener('scroll', this.handleScroll)
        window.removeEventListener('resize', this.handleResize)
        instance = null // un nouveau WindowContext repartira de zéro
    }

    /** nombre de pixels de l'écran par px CSS (1 sur un écran standard, 2 ou 3 sur un écran haute densité) */
    get pixelRatio() { return Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO) }
}
