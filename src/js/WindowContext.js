/** singleton : l'instance unique, partagée par toutes les scènes */
let instance = null

export default class WindowContext {
    constructor() {
        if (instance) return instance
        instance = this

        /** scenes : registre de toutes les scènes de la page */
        this.scenes = []
    }

    addScene(scene) { this.scenes.push(scene) }
}
