export default class DomElement {
    constructor(id) {
        this.id = id
        this.element = document.getElementById(id)
        this.measure()
    }

    /** taille affichée, bordure exclue (px CSS) */
    measure() {
        this.width = this.element.clientWidth
        this.height = this.element.clientHeight
    }
}
