import * as THREE from "three"

export default class Wall extends THREE.Mesh {
    constructor(color, depth) {
        /** géométrie unité (1 × 1 × 1 px), mise à la taille voulue par homothétie (scale) */
        super(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }))
        this.depth = depth // px
    }

    setSize(width, height) { this.scale.set(width, height, this.depth) }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}
