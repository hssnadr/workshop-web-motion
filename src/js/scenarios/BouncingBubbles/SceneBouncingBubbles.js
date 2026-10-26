import Scene2D from "../../canvas-2d/Scene2D"
import { circle } from "../../canvas-2d/Shapes2D"
import { randomRange } from "../../utils/math/MathUtils"

const BUBBLE_RADIUS = 10 // px
const LINE_WIDTH = 2 // px

class Bubble {
    constructor(context, x, y, radius) {
        this.context = context
        this.x = x // px
        this.y = y // px
        this.radius = radius // px
    }

    draw() {
        circle(this.context, this.x, this.y, this.radius, { isFill: true })
    }
}

export default class SceneBouncingBubbles extends Scene2D {
    constructor(nBubbles, id = "canvas-scene") {
        super(id)

        /** bubbles : conditions initiales tirées uniformément dans le canvas, à un rayon des bords */
        this.bubbles = []
        for (let i = 0; i < nBubbles; i++) {
            const x_ = randomRange(BUBBLE_RADIUS, this.width - BUBBLE_RADIUS)
            const y_ = randomRange(BUBBLE_RADIUS, this.height - BUBBLE_RADIUS)
            this.bubbles.push(new Bubble(this.context, x_, y_, BUBBLE_RADIUS))
        }

        /** init */
        this.resize()
    }

    draw() {
        /** style */
        this.context.strokeStyle = "white"
        this.context.fillStyle = "black"
        this.context.lineWidth = LINE_WIDTH

        this.bubbles.forEach(b => { b.draw() })
    }
}
