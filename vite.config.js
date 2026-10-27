import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
    root: 'src',
    build: {
        outDir: '../dist',
        chunkSizeWarningLimit: 1000 // ko : three.js seul dépasse la limite par défaut (500 ko)
    },
    publicDir: '../public',
    /** HTTPS en dev (certificat auto-signé) : les capteurs ne sont accessibles que dans un contexte sécurisé */
    plugins: [basicSsl()]
}
