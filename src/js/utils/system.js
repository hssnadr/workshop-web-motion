let isMobile_ = -1
let isMobileNoTablet_ = -1

/**
 * appareil mobile ? (résultat mis en cache)
 * @param {boolean} ignoreTablet les tablettes ne comptent pas comme mobiles
 * @returns {boolean}
 */
export function isMobileDevice(ignoreTablet = false) {
    if (ignoreTablet) {
        if (isMobileNoTablet_ !== -1) return isMobileNoTablet_
        if (navigator.userAgentData) return (isMobileNoTablet_ = navigator.userAgentData.mobile)
        const ua = navigator.userAgent || navigator.vendor || window.opera
        if (/android/i.test(ua) && !/tablet/i.test(ua)) return (isMobileNoTablet_ = true)
        if (/iPhone|iPod/i.test(ua)) return (isMobileNoTablet_ = true)
        return (isMobileNoTablet_ = navigator.maxTouchPoints > 0 && window.innerWidth < 768)
    }
    if (isMobile_ !== -1) return isMobile_
    if (navigator.userAgentData) return (isMobile_ = navigator.userAgentData.mobile)
    const ua = navigator.userAgent || navigator.vendor || window.opera
    if (/android/i.test(ua)) return (isMobile_ = true)
    if (/iPhone|iPad|iPod/i.test(ua)) return (isMobile_ = true)
    return (isMobile_ = navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
}
