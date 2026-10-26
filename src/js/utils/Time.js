import EventEmitter from "./EventEmitter"

export default class Time extends EventEmitter {
    constructor() {
        super()

        /** temps discret : on compte les images */
        this.frame = 0

        window.requestAnimationFrame(() => { this.update() })
    }

    update() {
        this.frame++
        this.trigger('update') // un pas de simulation par image

        window.requestAnimationFrame(() => { this.update() })
    }
}
