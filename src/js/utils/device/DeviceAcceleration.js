import EventEmitter from "../EventEmitter"

export default class DeviceAcceleration extends EventEmitter {
    constructor() {
        super()

        /** accélération mesurée, gravité comprise (m/s²) ; axes de l'appareil : x vers la droite, y vers le haut de l'écran, z vers l'utilisateur */
        this.x = 0
        this.y = 0
        this.z = 0

        this.handleMotion = (event) => {
            const acceleration_ = event.accelerationIncludingGravity
            if (acceleration_ === null || acceleration_.x === null) return // pas de capteur (ordinateur)
            this.x = acceleration_.x
            this.y = acceleration_.y
            this.z = acceleration_.z
            this.trigger('reading')
        }
        window.addEventListener('devicemotion', this.handleMotion)
    }

    destroy() { window.removeEventListener('devicemotion', this.handleMotion) }
}
