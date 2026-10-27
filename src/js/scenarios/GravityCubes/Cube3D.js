import * as THREE from "three"

export default class Cube3D extends THREE.Mesh {
    constructor(size, color) {
        super(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color }))
        this.size = size // px
    }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}
