import Scene2D from "../../canvas-2d/Scene2D"
import { circle, line } from "../../canvas-2d/Shapes2D"
import { distance2d, randomRange } from "../../utils/math/MathUtils"

const BUBBLE_RADIUS = 10 // px
const LINE_WIDTH = 2 // px
const MAX_SPEED = 1 // px/image
const LINK_DISTANCE = 50 // px

class Bubble {
    constructor(context, x, y, radius) {
        this.context = context
        this.x = x // px
        this.y = y // px
        this.radius = radius // px

        /** vitesse : un déplacement par image */
        this.vx = randomRange(-MAX_SPEED, MAX_SPEED) // px/image
        this.vy = randomRange(-MAX_SPEED, MAX_SPEED) // px/image
    }

    /** modèle d'état : position au pas n + 1 = position au pas n + vitesse */
    update(width, height) {
        this.x += this.vx
        this.y += this.vy

        /** bords : la vitesse repart toujours vers l'intérieur (idempotent : appliquer la règle deux fois ne change rien) */
        if (this.x < this.radius) this.vx = Math.abs(this.vx)
        if (this.x > width - this.radius) this.vx = -Math.abs(this.vx)
        if (this.y < this.radius) this.vy = Math.abs(this.vy)
        if (this.y > height - this.radius) this.vy = -Math.abs(this.vy)
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

    /** état → règle d'évolution → observation */
    update() {
        this.bubbles.forEach(b => { b.update(this.width, this.height) })

        this.clear()
        this.draw()
    }

    draw() {
        /** style */
        this.context.strokeStyle = "white"
        this.context.fillStyle = "black"
        this.context.lineWidth = LINE_WIDTH
        this.context.lineCap = "round"

        /** liens : chaque paire une seule fois (i < j), soit n(n − 1) / 2 paires → coût en n² */
        for (let i = 0; i < this.bubbles.length; i++) {
            const current_ = this.bubbles[i]
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const next_ = this.bubbles[j]
                if (distance2d(current_.x, current_.y, next_.x, next_.y) < LINK_DISTANCE)
                    line(this.context, current_.x, current_.y, next_.x, next_.y)
            }
        }

        /** bulles par-dessus les liens */
        this.bubbles.forEach(b => { b.draw() })
    }
}
