/** singleton : l'instance unique, partagée par toutes les scènes */
let instance = null

export default class WindowContext {
    constructor() {
        if (instance) return instance
        instance = this

        /** scenes : registre de toutes les scènes de la page */
        this.scenes = []

        /** events : un seul écouteur, répercuté à toutes les scènes */
        window.addEventListener('resize', () => { this.resize() })
    }

    addScene(scene) { this.scenes.push(scene) }

    resize() { this.scenes.forEach(s => { s.resize() }) }
}
