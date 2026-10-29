import * as THREE from "three"
import { Bodies, Body } from "matter-js"

/** three.js (y vers le haut) ↔ Matter.js (y vers le bas) : symétrie y → −y, qui est sa propre inverse */
export default class Cube3D extends THREE.Group {
    /** model : le modèle chargé, partagé ; clone() copie la hiérarchie mais garde les mêmes géométries, qui appartiennent à la scène */
    /** material : partagé aussi, il remplace ceux du modèle sur tous ses meshes */
    constructor(size, model, material) {
        super()
        this.size = size // px

        /** le modèle tient dans un cube de côté size, centré sur l'origine : homothétie (scale), puis translation */
        const box_ = new THREE.Box3().setFromObject(model)
        const scale_ = size / Math.max(...box_.getSize(new THREE.Vector3()).toArray())
        const model_ = model.clone()
        model_.traverse(o => { if (o.isMesh) o.material = material })
        model_.scale.setScalar(scale_)
        model_.position.copy(box_.getCenter(new THREE.Vector3())).multiplyScalar(-scale_)
        this.add(model_)

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
}
