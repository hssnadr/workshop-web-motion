/** iOS : l'accès aux capteurs se demande sur un geste de l'utilisateur (clic) ; ailleurs, il n'y a rien à demander */
export function askMotionAccess() {
    if (typeof window.DeviceMotionEvent?.requestPermission !== 'function') return
    DeviceMotionEvent.requestPermission()
        .then(permissionState => { if (permissionState === 'granted') window.location.reload() })
        .catch(console.error)
}
