import * as THREE from "three"
import { Bodies, Body } from "matter-js"

/** mur en forme de capsule (rectangle aux extrémités demi-circulaires), le long de x ; le matériau est partagé : il appartient à la scène */
export default class WallCapsule extends THREE.Mesh {
    constructor(width, height, material) {
        /** géométrie : rayon = demi-hauteur, longueur du corps = largeur − diamètre ; l'axe d'une capsule three.js est y, on le couche sur x */
        const geometry_ = new THREE.CapsuleGeometry(height / 2, width - height, 8)
        geometry_.rotateZ(Math.PI / 2)
        super(geometry_, material)
        this.depth = height // px, épaisseur selon z : le diamètre

        /** corps physique statique : le même rectangle, aux coins arrondis du rayon */
        this.body = Bodies.rectangle(0, 0, width, height, { isStatic: true, chamfer: { radius: height / 2 } })
    }

    setPosition(x, y) {
        this.position.set(x, y, -this.depth / 2) // reculée d'une demi-épaisseur : la face avant affleure le plan z = 0, comme celle des cubes

        /** Matter.js : y vers le bas, d'où le signe − sur y */
        Body.setPosition(this.body, { x, y: -y })
    }

    dispose() {
        this.geometry.dispose()
    }
}
