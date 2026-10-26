import Scene2D from "../../canvas-2d/Scene2D"

const CIRCLE_RADIUS = 20 // px
const STROKE_WIDTH = 2 // px

export default class SceneBouncingBubbles extends Scene2D {
    constructor(id = "canvas-scene") {
        super(id)

        /** init */
        this.resize()
    }

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
