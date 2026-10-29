let isMobile_ = -1

/**
 * appareil mobile ? (résultat mis en cache)
 * @returns {boolean}
 */
export function isMobileDevice() {
    if (isMobile_ !== -1) return isMobile_
    if (navigator.userAgentData) return (isMobile_ = navigator.userAgentData.mobile)
    const ua = navigator.userAgent || navigator.vendor || window.opera
    if (/android/i.test(ua)) return (isMobile_ = true)
    if (/iPhone|iPad|iPod/i.test(ua)) return (isMobile_ = true)
    return (isMobile_ = navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
}
