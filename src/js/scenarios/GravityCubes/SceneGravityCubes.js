import * as THREE from "three"
import { Composite, Engine, Runner } from "matter-js"
import Scene3D from "../../canvas-3d/Scene3D"
import Cube3D from "./Cube3D"
import Wall from "./Wall"
import { clamp, randomRange } from "../../utils/math/MathUtils"

const CAMERA_DISTANCE = 100 // px, la caméra regarde le plan z = 0 depuis z = 100
const CUBE_SIZE = 20 // px, longueur d'une arête
const CUBE_COLORS = ["red", "yellow", "blue"]
const WALL_THICKNESS = 15 // px

export default class SceneGravityCubes extends Scene3D {
    constructor(nCubes, id = "canvas-scene") {
        super(id)

        /** caméra orthographique : pas de perspective, son cadre (left, right, top, bottom) est réglé au resize */
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** physics : le moteur et sa propre boucle (Runner), qui le fait avancer à chaque image */
        this.engine = Engine.create()
        this.runner = Runner.create()
        Runner.run(this.runner, this.engine)

        /** device motion : l'inclinaison oriente la gravité du moteur */
        this.windowContext.useDeviceOrientation = true

        /** cubes : positions en px, tirées dans le canvas (origine au centre) */
        this.cubes = []
        for (let i = 0; i < nCubes; i++) {
            const cube_ = new Cube3D(CUBE_SIZE, CUBE_COLORS[i % CUBE_COLORS.length])
            cube_.setPosition(
                randomRange(-this.width / 2 + WALL_THICKNESS + CUBE_SIZE, this.width / 2 - WALL_THICKNESS - CUBE_SIZE),
                randomRange(-this.height / 2 + WALL_THICKNESS + CUBE_SIZE, this.height / 2 - WALL_THICKNESS - CUBE_SIZE)
            )
            this.cubes.push(cube_)
            this.add(cube_)
        }

        /** murs, le long des bords du canvas */
        this.walls = {
            left: new Wall("blue", CUBE_SIZE),
            right: new Wall("blue", CUBE_SIZE),
            top: new Wall("red", CUBE_SIZE),
            bottom: new Wall("yellow", CUBE_SIZE)
        }
        Object.values(this.walls).forEach(w => { this.add(w) })

        /** le monde physique : les mêmes objets, côté Matter.js */
        Composite.add(this.engine.world, [...this.cubes, ...Object.values(this.walls)].map(o => o.body))

        /** init */
        this.resize()
    }

    update() {
        this.cubes.forEach(c => { c.update() })
        this.render()
    }

    onDeviceOrientation() {
        const { beta, gamma } = this.windowContext.orientation

        /** direction de la pente : angle polaire du vecteur (gamma, beta), puis vecteur unitaire (cos, sin) — sa norme vaut toujours 1 */
        const angle_ = Math.atan2(beta, gamma) // rad
        this.engine.gravity.x = Math.cos(angle_)
        this.engine.gravity.y = Math.sin(angle_) // y de Matter.js vers le bas, comme beta > 0 (haut de l'appareil relevé)
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
            left.setPosition(-this.width / 2 + WALL_THICKNESS / 2, 0)
            right.setSize(WALL_THICKNESS, this.height)
            right.setPosition(this.width / 2 - WALL_THICKNESS / 2, 0)
            top.setSize(this.width - 2 * WALL_THICKNESS, WALL_THICKNESS)
            top.setPosition(0, this.height / 2 - WALL_THICKNESS / 2)
            bottom.setSize(this.width - 2 * WALL_THICKNESS, WALL_THICKNESS)
            bottom.setPosition(0, -this.height / 2 + WALL_THICKNESS / 2)
        }

        /** cubes restés hors du cadre (canvas rétréci) : ramenés entre les murs, sinon ils tomberaient hors du monde */
        const limitX_ = this.width / 2 - WALL_THICKNESS - CUBE_SIZE // px
        const limitY_ = this.height / 2 - WALL_THICKNESS - CUBE_SIZE // px
        this.cubes?.forEach(c => { c.setPosition(clamp(c.position.x, -limitX_, limitX_), clamp(c.position.y, -limitY_, limitY_)) })
    }

    destroy() {
        super.destroy()
        Composite.clear(this.engine.world)
        Runner.stop(this.runner) // sinon la boucle du moteur continue après destroy
        Engine.clear(this.engine)
    }
}
