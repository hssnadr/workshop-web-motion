/** tirage uniforme dans [min, max] : random() est uniforme dans [0, 1[, mis à l'échelle (× (max − min)) puis décalé (+ min) */
export const randomRange = (min, max) => min + Math.random() * (max - min)

/** Pythagore : d = √(dx² + dy²) */
export const distance2d = (x1, y1, x2, y2) => {
    const dx_ = x2 - x1
    const dy_ = y2 - y1
    return Math.sqrt(dx_ * dx_ + dy_ * dy_)
}
