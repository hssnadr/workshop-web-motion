import * as THREE from "three"
import Scene3D from "../../canvas-3d/Scene3D"

const CUBE_SIZE = 20 // longueur d'une arête (unités three.js)

export default class SceneGravityCubes extends Scene3D {
    constructor(id = "canvas-scene") {
        super(id)

        /** un cube, au centre de la scène */
        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
            new THREE.MeshBasicMaterial({ color: "red" })
        )
        this.add(this.cube)
    }

    update() {
        this.render()
    }
}
