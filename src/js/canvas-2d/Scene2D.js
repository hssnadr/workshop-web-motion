const CIRCLE_RADIUS = 20 // px
const STROKE_WIDTH = 2 // px

export default class Scene2D {
    constructor(id = "canvas-scene") {
        this.id = id

        /** canvas + context 2d */
        this.canvas = document.getElementById(id)
        this.context = this.canvas.getContext('2d')

        // TODO pédago : le CSS étire le canvas, mais son bitmap garde sa taille par défaut (300 × 150 px) → le cercle est déformé (cf. étape 1.3)
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
