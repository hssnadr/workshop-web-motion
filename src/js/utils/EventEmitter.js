/** publier / s'abonner : des callbacks rangés par nom d'événement */
export default class EventEmitter {
    constructor() {
        this.callbacks = {}
    }

    on(name, callback) {
        this.callbacks[name] ??= []
        this.callbacks[name].push(callback)
    }

    trigger(name) {
        (this.callbacks[name] ?? []).forEach(callback => { callback() })
    }
}
