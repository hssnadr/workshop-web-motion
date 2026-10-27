import EventEmitter from "../EventEmitter"

export default class DeviceOrientation extends EventEmitter {
    constructor() {
        super()

        /** angles de l'appareil (deg) */
        this.alpha = 0 // autour de z (boussole) : [0, 360[
        this.beta = 0 // autour de x (avant / arrière) : [−180, 180[
        this.gamma = 0 // autour de y (gauche / droite) : [−90, 90[

        this.handleOrientation = (event) => {
            if (event.beta === null) return // pas de capteur (ordinateur)
            this.alpha = event.alpha
            this.beta = event.beta
            this.gamma = event.gamma
            this.trigger('reading')
        }
        window.addEventListener('deviceorientation', this.handleOrientation)
    }

    destroy() { window.removeEventListener('deviceorientation', this.handleOrientation) }
}
