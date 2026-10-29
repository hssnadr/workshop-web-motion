import * as THREE from "three"
import { HDRLoader } from "three/addons/loaders/HDRLoader.js"
import { Composite, Engine, Runner } from "matter-js"
import Scene3D from "../../canvas-3d/Scene3D"
import Cube3D from "./Cube3D"
import Wall from "./Wall"
import WallCapsule from "./WallCapsule"
import DomElement from "../../utils/window/DomElement"
import { clamp, randomRange, toRadians } from "../../utils/math/MathUtils"
// import hdriUrl from "../../../assets/hdri/studio_small_09_1k.hdr?url"
import hdriUrl from "../../../assets/hdri/blender-2k.hdr?url"

const CAMERA_DISTANCE = 100 // px, la caméra regarde le plan z = 0 depuis z = 100
const CUBE_SIZE = 30 // px, longueur d'une arête
const CUBE_MATERIALS = [
    { color: "#111111", metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0 }, // noir brillant : une couche de vernis lisse sur le noir
    // { color: "#111111", roughness: 0.8 }, // noir mat : pas de vernis, la lumière est diffusée
    { color: "#eeeae0", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0 } // blanc légèrement cassé, brillant
]
const WALL_THICKNESS = 15 // px
const STANDARD_GRAVITY = 9.81 // m/s²
const GRAVITY_SCALE_FACTOR = 5 // gravité du moteur renforcée, pour que les cubes traversent vite le labyrinthe
const MAZE_WIDTH_RATIO = 0.15 // part de la largeur du canvas couverte par une barre du labyrinthe
const MAZE_OFFSET_RATIO = 0 // 1 / 5 // part de la hauteur du canvas entre son centre et une barre

export default class SceneGravityCubes extends Scene3D {
    constructor(nCubes, id = "canvas-scene", btnId = "btn-access", cubeModel) {
        super(id)

        /** modèle du cube : chargé une fois par le scénario (main.js), chaque cube en reçoit un clone */
        this.cubeModel = cubeModel

        /** bouton : posé par-dessus la scène, ses bounds donnent la capsule */
        this.btnElement = new DomElement(btnId)

        /** caméra orthographique : pas de perspective, son cadre (left, right, top, bottom) est réglé au resize */
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** world : ce qui est attaché à l'écran (objets et caméra) ; la lumière (l'HDRI) reste fixe, attachée à la scène */
        this.world = new THREE.Group()
        this.add(this.world)
        this.world.add(this.camera)

        /** lumière : l'HDRI mesure la lumière qui arrive de chaque direction ; elle éclaire tous les matériaux de la scène */
        this.environmentMap = new HDRLoader().load(hdriUrl, () => { this.environment = this.environmentMap }) // asynchrone : la scène n'est éclairée qu'une fois l'image chargée
        this.environmentMap.mapping = THREE.EquirectangularReflectionMapping // rectangle (longitude, latitude) → sphère des directions

        /** params : des curseurs */
        this.params.pixelRatio = this.windowContext.pixelRatio // pixels du bitmap par px CSS : le coût de rendu varie comme son carré
        this.params.environmentIntensity = 1 // × intensité de l'HDRI
        if (this.debug.isActive) {
            this.debugFolder.add(this.params, 'pixelRatio', 0.5, 3).onFinishChange(() => { this.resize() }) // redimensionne le bitmap : une fois le curseur relâché
            this.debugFolder.add(this.params, 'environmentIntensity', 0, 3).onChange(() => { this.environmentIntensity = this.params.environmentIntensity })
        }

        /** materials : partagés ; MeshPhysicalMaterial ajoute le vernis (clearcoat) à MeshStandardMaterial */
        this.materials = CUBE_MATERIALS.map(parameters => new THREE.MeshStandardMaterial(parameters))

        /** physics : le moteur et sa propre boucle (Runner), qui le fait avancer à chaque image */
        this.engine = Engine.create()
        this.runner = Runner.create()
        Runner.run(this.runner, this.engine)

        /** device motion : l'accéléromètre donne la gravité du moteur (direction et norme) */
        this.windowContext.useDeviceAcceleration = true
        this.engine.gravity.scale *= GRAVITY_SCALE_FACTOR

        /** device orientation : le world tourne avec le téléphone */
        this.windowContext.useDeviceOrientation = true

        /** cubes : positions en px, tirées dans le canvas (origine au centre) */
        this.cubes = []
        for (let i = 0; i < nCubes; i++) {
            const cube_ = new Cube3D(CUBE_SIZE, this.cubeModel, this.materials[i % this.materials.length])
            cube_.setPosition(
                randomRange(-this.width / 2 + CUBE_SIZE, this.width / 2 - CUBE_SIZE),
                randomRange(-this.height / 2 + CUBE_SIZE, this.height / 2 - CUBE_SIZE)
            )
            this.cubes.push(cube_)
            this.world.add(cube_)
        }

        /** murs à gauche et à droite ; haut et bas ouverts vers les scènes voisines */
        this.walls = {
            left: new Wall("blue", CUBE_SIZE),
            right: new Wall("blue", CUBE_SIZE)
        }

        Object.values(this.walls).forEach(w => { this.world.add(w) })

        /** le monde physique : les mêmes objets, côté Matter.js */
        Composite.add(this.engine.world, [...this.cubes, ...Object.values(this.walls)].map(o => o.body))

        /** maze : deux capsules, créées au premier resize, comme celle du bouton */
        this.wallMaze = []

        /** capsule : créée au premier resize, aux dimensions et à la position du bouton */
        this.wallCapsule = null

        /** init */
        this.resize()
    }

    /** même principe que pour la capsule du bouton : les barres du labyrinthe sont remplacées, les anciennes détruites */
    updateWallMaze() {
        if (!this.materials) return // appelé avant la fin du constructeur : rien à construire encore

        this.wallMaze?.forEach(w => {
            w.removeFromParent()
            Composite.remove(this.engine.world, w.body)
            w.dispose()
        })

        /** une barre collée au bord gauche en haut, une au bord droit en bas ; le passage alterne */
        const width_ = this.width * MAZE_WIDTH_RATIO // px
        const offsetX_ = (this.width - width_) / 2 // px, du centre du canvas au centre d'une barre collée à un bord
        const offsetY_ = this.height * MAZE_OFFSET_RATIO // px
        const radius_ = WALL_THICKNESS / 2 // px, rayon d'une extrémité : décalées vers l'extérieur, les extrémités arrondies collées au bord sortent du cadre

        this.wallMaze = [[-offsetX_ - radius_, offsetY_], [offsetX_ + radius_, -offsetY_]].map(([x, y]) => {
            const wall_ = new WallCapsule(width_, WALL_THICKNESS, this.materials[0])
            wall_.setPosition(x, y)
            this.world.add(wall_)
            Composite.add(this.engine.world, wall_.body)
            return wall_
        })
    }

    /** une capsule ne se redimensionne pas (les extrémités se déformeraient) : on la remplace, et on détruit l'ancienne */
    updateWallCapsule() {
        if (this.wallCapsule) {
            this.wallCapsule.removeFromParent()
            Composite.remove(this.engine.world, this.wallCapsule.body)
            this.wallCapsule.dispose()
        }

        /** bounds du bouton : taille affichée et centre, relatif au canvas (mesurés au même instant) → repère de la scène */
        const { left, right, top, bottom } = this.btnElement
        const centerX_ = (left + right) / 2 - this.domElement.left // px
        const centerY_ = (top + bottom) / 2 - this.domElement.top // px
        const x_ = centerX_ - this.width / 2 // px, repère de la scène : origine au centre
        const y_ = this.height / 2 - centerY_ // px, y vers le haut

        this.wallCapsule = new WallCapsule(right - left, bottom - top, this.materials[0])
        this.wallCapsule.setPosition(x_, y_)
        this.world.add(this.wallCapsule)
        Composite.add(this.engine.world, this.wallCapsule.body)
    }

    update() {
        this.cubes.forEach(c => { c.update() })
        this.render()
    }

    /** la densité vient du curseur, plus de l'écran */
    get pixelRatio() { return this.params.pixelRatio }

    /** taille d'un cube (px) : main.js s'en sert pour placer un objet qui entre juste en deçà du bord */
    get cubeSize() { return CUBE_SIZE }


    /** échanges entre scènes, par des méthodes publiques, comme les scènes 2D : position en px, repère de la scène */
    addBubble(x, y) {
        const cube_ = new Cube3D(CUBE_SIZE, this.cubeModel, this.materials[Math.floor(this.materials.length * Math.random())])
        cube_.setPosition(x, y)
        this.cubes.push(cube_)
        this.world.add(cube_)
        Composite.add(this.engine.world, cube_.body)
    }

    removeBubble(cube) {
        /** three.js : géométrie et matériau restent, partagés avec les autres cubes */
        cube.removeFromParent()

        /** Matter.js */
        Composite.remove(this.engine.world, cube.body)

        /** liste */
        this.cubes = this.cubes.filter(c => c !== cube)
    }

    onDeviceAcceleration() {
        const { x, y } = this.windowContext.acceleration
        this.debug.domDebug = `accélération x ${x.toFixed(2)} · y ${y.toFixed(2)} m/s²`

        /**
         * l'accéléromètre mesure la réaction du support, opposée à la gravité : g = −a (repère de l'appareil, y vers le haut)
         * normalisée par g terrestre : 1 = toute la gravité dans le plan de l'écran (appareil debout), 0 = appareil à plat
         */
        const gravity_ = { x: -x / STANDARD_GRAVITY, y: y / STANDARD_GRAVITY } // → repère de Matter.js (y vers le bas) : le signe de y change une seconde fois
        this.engine.gravity.x = gravity_.x
        this.engine.gravity.y = gravity_.y
    }

    /**
     * le world tourne comme le téléphone : vue depuis l'écran, c'est la lumière qui tourne en sens inverse (R⁻¹)
     * même convention que le capteur : rotations dans l'ordre Z, X, Y ; alpha (boussole) ignoré, faute de référence fiable
     */
    onDeviceOrientation() {
        const { beta, gamma } = this.windowContext.orientation
        this.world.rotation.set(-toRadians(beta), -toRadians(gamma), 0, 'ZXY')
    }

    /** au scroll, la position du canvas et celle du bouton changent ensemble : on mesure les deux */
    scroll() {
        super.scroll()
        this.btnElement.measure()
    }

    resize() {
        super.resize()

        /** référentiel : cadre de la caméra = le canvas en px → origine au centre, y vers le haut, 1 unité = 1 px */
        this.camera.left = -this.width / 2
        this.camera.right = this.width / 2
        this.camera.top = this.height / 2
        this.camera.bottom = -this.height / 2
        this.camera.updateProjectionMatrix() // sans elle, la caméra garde son ancien cadre

        /** murs : juste à l'extérieur des bords gauche et droit, deux fois plus hauts que le canvas (s'ils existent déjà) */
        if (this.walls) {
            const { left, right } = this.walls
            left.setSize(WALL_THICKNESS, 2 * this.height)
            left.setPosition(-this.width / 2 - WALL_THICKNESS / 2, 0)
            right.setSize(WALL_THICKNESS, 2 * this.height)
            right.setPosition(this.width / 2 + WALL_THICKNESS / 2, 0)
        }

        /** maze */
        this.updateWallMaze()

        /** capsule : le bouton est mesuré après le canvas, au même resize (s'il existe déjà) */
        if (this.btnElement) {
            this.btnElement.measure()
            this.updateWallCapsule()
        }

        /** cubes restés hors du cadre (canvas rétréci) : ramenés entre les murs, sinon ils tomberaient hors du monde */
        const limitX_ = this.width / 2 - CUBE_SIZE // px
        this.cubes?.forEach(c => { c.setPosition(clamp(c.position.x, -limitX_, limitX_), c.position.y) })
    }

    destroy() {
        super.destroy()
        this.cubeModel.traverse(o => {
            if (!o.isMesh) return
            o.geometry.dispose()
            ;[o.material].flat().forEach(m => { m.dispose() }) // matériaux d'origine du glb, plus utilisés par les cubes
        })
        this.materials.forEach(m => { m.dispose() })
        Object.values(this.walls).forEach(w => { w.dispose() })
        this.wallMaze?.forEach(w => { w.dispose() })
        this.wallCapsule?.dispose()
        this.environmentMap.dispose()
        Composite.clear(this.engine.world)
        Runner.stop(this.runner) // sinon la boucle du moteur continue après destroy
        Engine.clear(this.engine)
    }
}
