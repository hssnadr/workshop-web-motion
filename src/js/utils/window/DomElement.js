export default class DomElement {
    constructor(id) {
        this.id = id
        this.element = document.getElementById(id)
        this.measure()
    }

    /** taille affichée, bordure exclue (px CSS), et position dans la fenêtre (px, change au scroll) */
    measure() {
        this.width = this.element.clientWidth
        this.height = this.element.clientHeight

        const rect_ = this.element.getBoundingClientRect()
        this.top = rect_.top
        this.bottom = rect_.bottom
        this.left = rect_.left
        this.right = rect_.right
    }

    /** visible si [top, bottom] chevauche [0, hauteur de la fenêtre], et de même en x */
    get isVisible() {
        return this.bottom > 0 && this.top < window.innerHeight
            && this.right > 0 && this.left < window.innerWidth
    }
}
