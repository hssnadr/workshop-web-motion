import * as THREE from "three"
import { HDRLoader } from "three/addons/loaders/HDRLoader.js"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { Composite, Engine, Runner } from "matter-js"
import Scene3D from "../../canvas-3d/Scene3D"
import Cube3D from "./Cube3D"
import Wall from "./Wall"
import { clamp, randomRange, toRadians } from "../../utils/math/MathUtils"
import hdriUrl from "../../../assets/hdri/studio_small_09_1k.hdr?url"

const CAMERA_DISTANCE = 100 // px, la caméra regarde le plan z = 0 depuis z = 100
const CUBE_SIZE = 20 // px, longueur d'une arête
const CUBE_SEGMENTS = 4 // subdivisions d'un arrondi : plus il y en a, plus la normale varie en douceur
const CUBE_COLORS = ["red", "yellow", "blue"]
const WALL_THICKNESS = 15 // px
const STANDARD_GRAVITY = 9.81 // m/s²
const GRAVITY_SCALE_FACTOR = 5 // gravité du moteur renforcée, pour que les cubes traversent vite le labyrinthe
const MAZE_WIDTH_RATIO = 2 / 3 // part de la largeur du canvas couverte par une barre du labyrinthe
const MAZE_OFFSET_RATIO = 1 / 6 // part de la hauteur du canvas entre son centre et une barre
const MSAA_SAMPLES = 4 // échantillons par pixel, moyennés : antialiasing dans la chaîne d'effets

export default class SceneGravityCubes extends Scene3D {
    constructor(nCubes, id = "canvas-scene") {
        super(id)

        /** caméra orthographique : pas de perspective, son cadre (left, right, top, bottom) est réglé au resize */
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2 * CAMERA_DISTANCE)
        this.camera.position.z = CAMERA_DISTANCE

        /** world : ce qui est attaché à l'écran (objets et caméra) ; la lumière (l'HDRI) reste fixe, attachée à la scène */
        this.world = new THREE.Group()
        this.scene.add(this.world)
        this.world.add(this.camera)

        /** lumière : l'HDRI mesure la lumière qui arrive de chaque direction ; elle éclaire tous les matériaux de la scène */
        this.environmentMap = new HDRLoader().load(hdriUrl, () => { this.scene.environment = this.environmentMap }) // asynchrone : la scène n'est éclairée qu'une fois l'image chargée
        this.environmentMap.mapping = THREE.EquirectangularReflectionMapping // rectangle (longitude, latitude) → sphère des directions

        /** params : des curseurs dans [0, 1] */
        this.params.roughness = 0.3 // 0 = lisse (reflet net), 1 = mat (lumière diffusée)
        this.params.metalness = 0 // 0 = plastique, 1 = métal (le reflet prend la couleur du matériau)
        this.params.environmentIntensity = 1 // × intensité de l'HDRI
        this.params.cubeRadius = 4 // px, rayon des arêtes (au plus une demi-arête)
        if (this.debug.isActive) {
            this.debugFolder.add(this.params, 'roughness', 0, 1).onChange(() => { this.materials.forEach(m => { m.roughness = this.params.roughness }) })
            this.debugFolder.add(this.params, 'metalness', 0, 1).onChange(() => { this.materials.forEach(m => { m.metalness = this.params.metalness }) })
            this.debugFolder.add(this.params, 'environmentIntensity', 0, 3).onChange(() => { this.scene.environmentIntensity = this.params.environmentIntensity })
            this.debugFolder.add(this.params, 'cubeRadius', 0, CUBE_SIZE / 2).onFinishChange(() => { this.updateCubeGeometry() })
        }

        /** materials : un par couleur, partagé par les cubes de cette couleur ; un réglage s'applique à tous */
        const { roughness, metalness } = this.params
        this.materials = CUBE_COLORS.map(color => new THREE.MeshStandardMaterial({ color, roughness, metalness }))

        /** geometry : un cube aux arêtes arrondies, partagé par tous les cubes */
        this.cubeGeometry = new RoundedBoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, CUBE_SEGMENTS, this.params.cubeRadius)

        /** params : bloom */
        this.params.bloomStrength = 0.5
        this.params.bloomRadius = 0.4 // [0, 1]
        this.params.bloomThreshold = 1 // intensité au-delà de laquelle un pixel diffuse : seuls les reflets les plus forts
        if (this.debug.isActive) {
            this.debugFolder.add(this.params, 'bloomStrength', 0, 3).onChange(() => { this.bloomPass.strength = this.params.bloomStrength })
            this.debugFolder.add(this.params, 'bloomRadius', 0, 1).onChange(() => { this.bloomPass.radius = this.params.bloomRadius })
            this.debugFolder.add(this.params, 'bloomThreshold', 0, 2).onChange(() => { this.bloomPass.threshold = this.params.bloomThreshold })
        }

        /** post-processing : l'image rendue passe par une chaîne d'effets, chacun reçoit l'image du précédent */
        const { bloomStrength, bloomRadius, bloomThreshold } = this.params
        this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MSAA_SAMPLES })) // taille réglée au resize
        this.composer.addPass(new RenderPass(this.scene, this.camera))
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(), bloomStrength, bloomRadius, bloomThreshold) // taille réglée au resize
        this.composer.addPass(this.bloomPass)
        this.outputPass = new OutputPass() // en dernier : conversion linéaire → sRGB
        this.composer.addPass(this.outputPass)

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
            const cube_ = new Cube3D(CUBE_SIZE, this.cubeGeometry, this.materials[i % this.materials.length])
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

        /** maze */
        this.wallMaze1 = new Wall("white", CUBE_SIZE)
        this.wallMaze2 = new Wall("white", CUBE_SIZE)
        this.world.add(this.wallMaze1)
        this.world.add(this.wallMaze2)
        Object.values(this.walls).forEach(w => { this.world.add(w) })

        /** le monde physique : les mêmes objets, côté Matter.js */
        Composite.add(this.engine.world, [...this.cubes, ...Object.values(this.walls), this.wallMaze1, this.wallMaze2].map(o => o.body))

        /** init */
        this.resize()
    }

    /** une géométrie ne se modifie pas : on la remplace, et on détruit l'ancienne */
    updateCubeGeometry() {
        this.cubeGeometry.dispose()
        this.cubeGeometry = new RoundedBoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, CUBE_SEGMENTS, this.params.cubeRadius)
        this.cubes.forEach(c => { c.geometry = this.cubeGeometry })
    }

    update() {
        this.cubes.forEach(c => { c.update() })
        this.render()
    }

    /** la chaîne d'effets remplace le rendu direct */
    render() { this.composer.render() }


    /** échanges entre scènes, par des méthodes publiques, comme les scènes 2D : position en px, repère de la scène */
    addBubble(x, y) {
        const cube_ = new Cube3D(CUBE_SIZE, this.cubeGeometry, this.materials[Math.floor(this.materials.length * Math.random())])
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
        this.world.rotation.set(toRadians(beta), toRadians(gamma), 0, 'ZXY')
    }

    resize() {
        super.resize()

        /** post-processing : mêmes dimensions et même densité que le renderer */
        this.composer.setPixelRatio(this.windowContext.pixelRatio)
        this.composer.setSize(this.width, this.height)

        /** référentiel : cadre de la caméra = le canvas en px → origine au centre, y vers le haut, 1 unité = 1 px */
        this.camera.left = -this.width / 2
        this.camera.right = this.width / 2
        this.camera.top = this.height / 2
        this.camera.bottom = -this.height / 2
        this.camera.updateProjectionMatrix() // sans elle, la caméra garde son ancien cadre

        /** murs : juste à l'extérieur des bords gauche et droit, deux fois plus hauts que le canvas */
        const { left, right } = this.walls
        left.setSize(WALL_THICKNESS, 2 * this.height)
        left.setPosition(-this.width / 2 - WALL_THICKNESS / 2, 0)
        right.setSize(WALL_THICKNESS, 2 * this.height)
        right.setPosition(this.width / 2 + WALL_THICKNESS / 2, 0)

        /** maze : une barre collée au bord gauche en haut, une au bord droit en bas ; le passage alterne */
        const width_ = this.width * MAZE_WIDTH_RATIO // px
        const offsetX_ = (this.width - width_) / 2 // px, du centre du canvas au centre d'une barre collée à un bord
        const offsetY_ = this.height * MAZE_OFFSET_RATIO // px

        this.wallMaze1.setSize(width_, WALL_THICKNESS)
        this.wallMaze1.setPosition(-offsetX_, offsetY_)

        this.wallMaze2.setSize(width_, WALL_THICKNESS)
        this.wallMaze2.setPosition(offsetX_, -offsetY_)

        /** cubes restés hors du cadre (canvas rétréci) : ramenés entre les murs, sinon ils tomberaient hors du monde */
        const limitX_ = this.width / 2 - CUBE_SIZE // px
        this.cubes.forEach(c => { c.setPosition(clamp(c.position.x, -limitX_, limitX_), c.position.y) })

        this.render()
    }

    destroy() {
        super.destroy()
        this.cubeGeometry.dispose()
        this.materials.forEach(m => { m.dispose() })
        Object.values(this.walls).forEach(w => { w.dispose() })
        this.wallMaze1.dispose()
        this.wallMaze2.dispose()
        this.environmentMap.dispose()
        this.bloomPass.dispose()
        this.outputPass.dispose()
        this.composer.dispose()
        Composite.clear(this.engine.world)
        Runner.stop(this.runner) // sinon la boucle du moteur continue après destroy
        Engine.clear(this.engine)
    }
}
