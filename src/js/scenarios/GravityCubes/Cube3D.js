import * as THREE from "three"
import { Bodies, Body } from "matter-js"

/** three.js (y vers le haut) ↔ Matter.js (y vers le bas) : symétrie y → −y, qui est sa propre inverse */
export default class Cube3D extends THREE.Mesh {
    /** le matériau est partagé : il appartient à la scène, qui le détruit */
    constructor(size, material) {
        super(new THREE.BoxGeometry(size, size, size), material)
        this.size = size // px

        /** corps physique : le même carré, côté Matter.js */
        this.body = Bodies.rectangle(0, 0, size, size)
    }

    setPosition(x, y) {
        /** Matter.js : y vers le bas, d'où le signe − sur y */
        Body.setPosition(this.body, { x, y: -y })
        this.update()
    }

    /** le mesh suit le corps physique */
    update() {
        /** three.js : y vers le haut, Matter.js : y vers le bas, d'où le signe − sur y et sur l'angle (sens de rotation inversé) */
        this.position.x = this.body.position.x
        this.position.y = -this.body.position.y
        this.rotation.z = -this.body.angle
    }

    dispose() { this.geometry.dispose() }
}
