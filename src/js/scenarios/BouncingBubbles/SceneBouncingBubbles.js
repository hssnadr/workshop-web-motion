import Scene2D from "../../canvas-2d/Scene2D"
import WindowContext from "../../WindowContext"
import { circle, line } from "../../canvas-2d/Shapes2D"
import { clamp, distance2d, randomRange } from "../../utils/math/MathUtils"

const MAX_SPEED = 100 // px/s

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
     * fausse gravité (dérive) : annulée aux bords gauche et droit, sinon elle pousserait la bulle hors du cadre
     * bords haut et bas ouverts : la bulle sort, et main.js la fait entrer dans une autre scène
     */
    update(width, height) {
        const dt_ = this.time.delta / 1000 // ms → s

        const isOnBorderX_ = this.x < this.radius || this.x > width - this.radius
        // const isOnBorderY_ = this.y < this.radius || this.y > height - this.radius // bords haut et bas fermés
        const driftX_ = isOnBorderX_ ? 0 : this.driftX
        const driftY_ = this.driftY // bords haut et bas ouverts : la dérive n'est pas annulée
        // const driftY_ = isOnBorderY_ ? 0 : this.driftY

        this.x += (this.vx + driftX_) * dt_
        this.y += (this.vy + driftY_) * dt_

        /** bords gauche et droit : la vitesse repart toujours vers l'intérieur (idempotent : appliquer la règle deux fois ne change rien) */
        if (this.x < this.radius) this.vx = Math.abs(this.vx)
        if (this.x > width - this.radius) this.vx = -Math.abs(this.vx)
        // if (this.y < this.radius) this.vy = Math.abs(this.vy)
        // if (this.y > height - this.radius) this.vy = -Math.abs(this.vy)
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
        this.params.radius = 20 // px
        this.params.linkDistance = 200 // px
        this.params.lineWidth = 10 // px
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
        this.resize()
        this.generateBubbles()
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
        this.context.fillStyle = "white"
        this.context.lineWidth = this.params.lineWidth
        this.context.lineCap = "round"

        this.context.strokeStyle = "red"

        /**
         * liens : chaque paire une seule fois (i < j), soit n(n − 1) / 2 paires → coût en n²
         * opacité : 1 jusqu'à linkDistance / 2 − rayon, puis décroît linéairement jusqu'à 0 à linkDistance (proportionnalité, saturée dans [0, 1])
         */
        const { linkDistance, radius } = this.params
        const opaqueDistance_ = linkDistance / 2 - radius // px
        for (let i = 0; i < this.bubbles.length; i++) {
            const current_ = this.bubbles[i]
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const next_ = this.bubbles[j]
                const distance_ = distance2d(current_.x, current_.y, next_.x, next_.y)
                if (distance_ < linkDistance) {
                    this.context.globalAlpha = clamp((linkDistance - distance_) / (linkDistance - opaqueDistance_), 0, 1)
                    line(this.context, current_.x, current_.y, next_.x, next_.y)
                }
            }
        }
        this.context.globalAlpha = 1 // les bulles, elles, restent opaques

        /** bulles par-dessus les liens */
        this.context.lineWidth = 4
        this.context.strokeStyle = "blue"
        this.context.fillStyle = "white"
        this.bubbles.forEach(b => { b.draw() })
    }

    /** échanges entre scènes, par des méthodes publiques : position en px (repère du canvas), vitesse en px/s (gardée au hasard si elle n'est pas donnée) */
    addBubble(x, y, vx = null, vy = null) {
        const bubble_ = new Bubble(this.context, x, y, this.params.radius)
        bubble_.vx = vx ?? bubble_.vx
        bubble_.vy = vy ?? bubble_.vy
        this.bubbles.push(bubble_)
    }

    removeBubble(bubble) { this.bubbles = this.bubbles.filter(b => b !== bubble) }

    onDeviceOrientation() {
        let gx_ = this.orientation.gamma / 90
        let gy_ = this.orientation.beta / 90
        gx_ = clamp(gx_, -1, 1)
        gy_ = clamp(gy_, -1, 1)

        /** update bubbles */
        if (!!this.bubbles) {
            this.bubbles.forEach(b => {
                b.driftX = gx_ * this.params.gStrength
                b.driftY = gy_ * this.params.gStrength
            })
        }
    }
}
