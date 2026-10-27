import * as THREE from "three"
import Scene3D from "../../canvas-3d/Scene3D"

const CAMERA_DISTANCE = 100 // px, la caméra regarde le plan z = 0 depuis z = 100
const CUBE_SIZE = 20 // px, longueur d'une arête
const WALL_THICKNESS = 15 // px

class Cube3D extends THREE.Mesh {
    constructor(size, color) {
        super(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color }))
        this.size = size // px
    }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}

class Wall extends THREE.Mesh {
    constructor(color, depth) {
        /** géométrie unité (1 × 1 × 1 px), mise à la taille voulue par homothétie (scale) */
        super(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color }))
        this.depth = depth // px
    }

    setSize(width, height) { this.scale.set(width, height, this.depth) }
}

export default class SceneGravityCubes extends Scene3D {
    constructor(id = "canvas-scene") {
        super(id)

        /** caméra orthographique : pas de perspective, son cadre (left, right, top, bottom) est réglé au resize */
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** un cube, au centre de la scène */
        this.cube = new Cube3D(CUBE_SIZE, "red")
        this.add(this.cube)

        /** murs, le long des bords du canvas */
        this.walls = {
            left: new Wall("blue", CUBE_SIZE),
            right: new Wall("blue", CUBE_SIZE),
            top: new Wall("red", CUBE_SIZE),
            bottom: new Wall("yellow", CUBE_SIZE)
        }
        Object.values(this.walls).forEach(w => { this.add(w) })

        /** init */
        this.resize()
    }

    update() {
        this.render()
    }

    resize() {
        super.resize()

        /** référentiel : cadre de la caméra = le canvas en px → origine au centre, y vers le haut, 1 unité = 1 px */
        this.camera.left = -this.width / 2
        this.camera.right = this.width / 2
        this.camera.top = this.height / 2
        this.camera.bottom = -this.height / 2
        this.camera.updateProjectionMatrix() // sans elle, la caméra garde son ancien cadre

        /** murs : à l'intérieur du canvas, collés à ses bords (s'ils existent déjà : le cadre appelle resize() avant la fin du constructeur) */
        if (this.walls) {
            const { left, right, top, bottom } = this.walls
            left.setSize(WALL_THICKNESS, this.height)
            left.position.x = -this.width / 2 + WALL_THICKNESS / 2
            right.setSize(WALL_THICKNESS, this.height)
            right.position.x = this.width / 2 - WALL_THICKNESS / 2
            top.setSize(this.width - 2 * WALL_THICKNESS, WALL_THICKNESS)
            top.position.y = this.height / 2 - WALL_THICKNESS / 2
            bottom.setSize(this.width - 2 * WALL_THICKNESS, WALL_THICKNESS)
            bottom.position.y = -this.height / 2 + WALL_THICKNESS / 2
        }
    }
}
