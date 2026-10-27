import GUI from "lil-gui"

export default class Debug {
    constructor() {
        /** actif seulement avec #debug à la fin de l'URL */
        this.isActive = window.location.hash === '#debug'
        if (this.isActive) this.ui = new GUI()
    }

    /** texte affiché dans la page (#debug), pour lire une mesure sur le téléphone */
    set domDebug(content) {
        if (!this.isActive) return
        const element_ = document.getElementById("debug")
        element_.style.display = "block"
        element_.textContent = content
    }

    destroy() {
        if (this.isActive) this.ui.destroy()
    }
}
