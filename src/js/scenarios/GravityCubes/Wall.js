import * as THREE from "three"
import { Bodies, Body } from "matter-js"

export default class Wall extends THREE.Mesh {
    constructor(color, depth) {
        /** géométrie unité (1 × 1 × 1 px), mise à la taille voulue par homothétie (scale) */
        super(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }))
        this.depth = depth // px

        /** corps physique statique, lui aussi de taille unité */
        this.body = Bodies.rectangle(0, 0, 1, 1, { isStatic: true })
    }

    setSize(width, height) {
        /** corps : homothétie inverse (1 / scale) pour revenir à la taille unité, puis homothétie vers la nouvelle taille */
        Body.scale(this.body, 1 / this.scale.x, 1 / this.scale.y)
        Body.scale(this.body, width, height)

        /** mesh */
        this.scale.set(width, height, this.depth)
    }

    setPosition(x, y) {
        this.position.set(x, y, 0)

        /** Matter.js : y vers le bas, d'où le signe − sur y */
        Body.setPosition(this.body, { x, y: -y })
    }
}
