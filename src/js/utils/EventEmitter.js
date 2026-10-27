/** publier / s'abonner : des callbacks rangés par nom d'événement */
export default class EventEmitter {
    constructor() {
        this.callbacks = {}
    }

    on(name, callback) {
        this.callbacks[name] ??= []
        this.callbacks[name].push(callback)
    }

    /** retire ce callback-là : il faut la même fonction (même référence) que celle passée à on() */
    off(name, callback) {
        this.callbacks[name] = (this.callbacks[name] ?? []).filter(c => c !== callback)
    }

    trigger(name) {
        (this.callbacks[name] ?? []).forEach(callback => { callback() })
    }
}
