import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
    root: 'src',
    build: {
        outDir: '../dist'
    },
    publicDir: '../public',
    /** HTTPS en dev (certificat auto-signé) : les capteurs ne sont accessibles que dans un contexte sécurisé */
    plugins: [basicSsl()]
}
