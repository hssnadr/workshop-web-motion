/** fonctions de dessin : tout ce dont elles ont besoin arrive en paramètre */

export function circle(context, x, y, radius, { isStroke = true, isFill = false } = {}) {
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI) // un tour complet = 2π rad
    if (isFill) context.fill()
    if (isStroke) context.stroke()
}

export function line(context, x1, y1, x2, y2) {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
}
