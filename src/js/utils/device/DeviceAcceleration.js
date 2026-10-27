import EventEmitter from "../EventEmitter"

export default class DeviceAcceleration extends EventEmitter {
    constructor() {
        super()

        /** accélération mesurée, gravité comprise (m/s²) ; axes de l'appareil : x vers la droite, y vers le haut de l'écran, z vers l'utilisateur */
        this.x = 0
        this.y = 0
        this.z = 0

        /**
         * convention d'axes : iOS mesure l'accélération de signe opposé à la norme (W3C, Android) ; le capteur la ramène à la norme, les scènes ne connaissent pas la plateforme
         * plateforme, pas fonctionnalité : requestPermission n'est pas propre à iOS (Chrome Android l'expose aussi) ; un iPad en mode « site de bureau » se présente comme un Mac, mais lui seul a un écran tactile
         */
        const isIOS_ = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        const sign_ = isIOS_ ? -1 : 1

        this.handleMotion = (event) => {
            const acceleration_ = event.accelerationIncludingGravity
            if (acceleration_ === null || acceleration_.x === null) return // pas de capteur (ordinateur)
            this.x = sign_ * acceleration_.x
            this.y = sign_ * acceleration_.y
            this.z = sign_ * acceleration_.z
            this.trigger('reading')
        }
        window.addEventListener('devicemotion', this.handleMotion)
    }

    destroy() { window.removeEventListener('devicemotion', this.handleMotion) }
}
