const CIRCLE_RADIUS = 20 // px
const STROKE_WIDTH = 2 // px

export default class Scene2D {
    constructor(id = "canvas-scene") {
        this.id = id

        /** canvas + context 2d */
        this.canvas = document.getElementById(id)
        this.context = this.canvas.getContext('2d')

        /** size : bitmap = taille affichée, bordure exclue (rapport 1 px bitmap / 1 px CSS → plus de déformation) */
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight

        this.draw()
    }

    get width() { return this.canvas.width }
    get height() { return this.canvas.height }

    draw() {
        /** style */
        this.context.strokeStyle = "white"
        this.context.lineWidth = STROKE_WIDTH

        /** circle : centre = milieu du canvas (origine en haut à gauche, y vers le bas) */
        this.context.beginPath()
        this.context.arc(this.width / 2, this.height / 2, CIRCLE_RADIUS, 0, 2 * Math.PI) // un tour complet = 2π rad
        this.context.stroke()
        this.context.closePath()
    }
}
