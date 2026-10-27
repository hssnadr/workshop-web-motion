import EventEmitter from "./EventEmitter"

const MAX_DELTA = 100 // ms : au-delà (onglet en arrière-plan, pause du débogueur), le pas est borné

export default class Time extends EventEmitter {
    constructor() {
        super()

        /** temps continu, mesuré : horodatage de l'image courante et durée du dernier pas */
        this.current = performance.now() // ms
        this.delta = 0 // ms

        window.requestAnimationFrame((timestamp) => { this.update(timestamp) })
    }

    update(timestamp) {
        this.delta = Math.min(timestamp - this.current, MAX_DELTA)
        this.current = timestamp
        this.trigger('update') // un pas de simulation par image, de durée delta

        window.requestAnimationFrame((timestamp) => { this.update(timestamp) })
    }
}
