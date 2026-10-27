/** tirage uniforme dans [min, max] : random() est uniforme dans [0, 1[, mis à l'échelle (× (max − min)) puis décalé (+ min) */
export const randomRange = (min, max) => min + Math.random() * (max - min)

/** Pythagore : d = √(dx² + dy²) */
export const distance2d = (x1, y1, x2, y2) => {
    const dx_ = x2 - x1
    const dy_ = y2 - y1
    return Math.sqrt(dx_ * dx_ + dy_ * dy_)
}

/** borner : ramène value dans [min, max] (saturation) */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/** proportionnalité : 180° = π rad */
export const toRadians = (angle) => angle * Math.PI / 180
