/** tirage uniforme dans [min, max] : random() est uniforme dans [0, 1[, mis à l'échelle (× (max − min)) puis décalé (+ min) */
export const randomRange = (min, max) => min + Math.random() * (max - min)
