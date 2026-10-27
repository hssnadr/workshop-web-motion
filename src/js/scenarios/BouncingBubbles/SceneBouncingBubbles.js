import Scene2D from "../../canvas-2d/Scene2D"
import WindowContext from "../../WindowContext"
import { circle, line } from "../../canvas-2d/Shapes2D"
import { clamp, distance2d, randomRange } from "../../utils/math/MathUtils"

const MAX_SPEED = 100 // px/s
const MAX_TILT = 90 // deg : inclinaison qui donne l'effet maximal

class Bubble {
    constructor(context, x, y, radius) {
        this.context = context
        this.x = x // px
        this.y = y // px
        this.radius = radius // px

        /** temps : le singleton du contexte, d'où la bulle lit la durée du pas */
        this.time = new WindowContext().time

        /** vitesse : un déplacement par seconde, indépendant de la fréquence de l'écran */
        this.vx = randomRange(-MAX_SPEED, MAX_SPEED) // px/s
        this.vy = randomRange(-MAX_SPEED, MAX_SPEED) // px/s

        /** fausse gravité : une vitesse (px/s) ajoutée à celle de la bulle, fixée par la scène à chaque mesure d'orientation */
        this.driftX = 0 // px/s
        this.driftY = 0 // px/s
    }

    /**
     * modèle d'état : dx = v·dt (px/s × s = px)
     * fausse gravité (dérive), modèle simplifié : annulée au bord, sinon elle pousserait la bulle hors du cadre
     */
    update(width, height) {
        const dt_ = this.time.delta / 1000 // ms → s

        const isOnBorderX_ = this.x < this.radius || this.x > width - this.radius
        const isOnBorderY_ = this.y < this.radius || this.y > height - this.radius
        const driftX_ = isOnBorderX_ ? 0 : this.driftX
        const driftY_ = isOnBorderY_ ? 0 : this.driftY

        this.x += (this.vx + driftX_) * dt_
        this.y += (this.vy + driftY_) * dt_

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

        /** params */
        this.params.nBubbles = nBubbles
        this.params.radius = 10 // px
        this.params.linkDistance = 50 // px
        this.params.lineWidth = 2 // px
        this.params.gStrength = 300 // px/s, à inclinaison maximale
        if (this.debug.isActive) {
            this.debugFolder.add(this.params, 'nBubbles', 0, 50, 1).onFinishChange(() => { this.generateBubbles() })
            this.debugFolder.add(this.params, 'radius', 1, 30).onChange(() => { this.bubbles.forEach(b => { b.radius = this.params.radius }) })
            this.debugFolder.add(this.params, 'linkDistance', 0, 300)
            this.debugFolder.add(this.params, 'lineWidth', 1, 10)
            this.debugFolder.add(this.params, 'gStrength', 0, 500)
        }

        /** device motion */
        this.windowContext.useDeviceOrientation = true
        this.orientation = this.windowContext.orientation

        /** init */
        this.generateBubbles()
        this.resize()
    }

    /** bubbles : conditions initiales tirées uniformément dans le canvas, à un rayon des bords */
    generateBubbles() {
        const radius_ = this.params.radius
        this.bubbles = []
        for (let i = 0; i < this.params.nBubbles; i++) {
            const x_ = randomRange(radius_, this.width - radius_)
            const y_ = randomRange(radius_, this.height - radius_)
            this.bubbles.push(new Bubble(this.context, x_, y_, radius_))
        }
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
        this.context.lineWidth = this.params.lineWidth
        this.context.lineCap = "round"

        /** liens : chaque paire une seule fois (i < j), soit n(n − 1) / 2 paires → coût en n² */
        for (let i = 0; i < this.bubbles.length; i++) {
            const current_ = this.bubbles[i]
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const next_ = this.bubbles[j]
                if (distance2d(current_.x, current_.y, next_.x, next_.y) < this.params.linkDistance)
                    line(this.context, current_.x, current_.y, next_.x, next_.y)
            }
        }

        /** bulles par-dessus les liens */
        this.bubbles.forEach(b => { b.draw() })
    }

    onDeviceOrientation() {
        const { beta, gamma } = this.orientation

        /** calibrer : angle ramené à [−1, 1] (÷ 90°), puis saturé au-delà (clamp) ; gamma penche à gauche / droite, beta vers l'avant / l'arrière */
        const gx_ = clamp(gamma / MAX_TILT, -1, 1)
        const gy_ = clamp(beta / MAX_TILT, -1, 1)
        this.debug.domDebug = `inclinaison x ${gx_.toFixed(2)} · y ${gy_.toFixed(2)}`

        /** fausse gravité : l'inclinaison calibrée, mise à l'échelle (px/s), devient la dérive de chaque bulle */
        this.bubbles.forEach(b => {
            b.driftX = gx_ * this.params.gStrength
            b.driftY = gy_ * this.params.gStrength
        })
    }
}
