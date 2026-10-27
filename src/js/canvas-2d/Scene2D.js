import DomElement from "../utils/window/DomElement"
import WindowContext from "../WindowContext"

export default class Scene2D {
    constructor(id = "canvas-scene") {
        this.id = id

        /** window context : chaque scène s'inscrit au même registre */
        this.windowContext = new WindowContext()
        this.windowContext.addScene(this)

        /** debug : params = seule source de vérité des réglages, un dossier par scène */
        this.params = {}
        this.debug = this.windowContext.debug
        if (this.debug.isActive) this.debugFolder = this.debug.ui.addFolder(id)

        /** canvas + context 2d */
        this.domElement = new DomElement(id)
        this.canvas = this.domElement.element
        this.context = this.canvas.getContext('2d')

        /** pas de resize ici : le scénario l'appelle, une fois son propre état prêt */
    }

    get width() { return this.domElement.width }
    get height() { return this.domElement.height }

    clear() { this.context.clearRect(0, 0, this.width, this.height) }

    /** un pas de simulation : défini par chaque scénario */
    update() {}

    resize() {
        /** size : bitmap = taille affichée × densité de l'écran (homothétie de rapport pixelRatio) */
        this.domElement.measure()
        const pixelRatio_ = this.windowContext.pixelRatio
        this.canvas.width = this.domElement.width * pixelRatio_
        this.canvas.height = this.domElement.height * pixelRatio_

        /** on dessine toujours en px CSS : le contexte applique la même homothétie */
        this.context.scale(pixelRatio_, pixelRatio_)

        /** changer la taille du bitmap l'efface : on redessine */
        this.draw()
    }

    /** contenu : défini par chaque scénario */
    draw() {}
}
