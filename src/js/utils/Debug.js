import GUI from "lil-gui"

export default class Debug {
    constructor() {
        /** actif seulement avec #debug à la fin de l'URL */
        this.isActive = window.location.hash === '#debug'
        if (this.isActive) this.ui = new GUI()
    }

    destroy() {
        if (this.isActive) this.ui.destroy()
    }
}
