const { defineConfig } = require('vite')
//import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
const { resolve } = require('path')

module.exports = defineConfig({
    base: '',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                player: resolve(__dirname, 'embed.html'),
                embed: resolve(__dirname, 'embed.js'),
            },
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    },
    optimizeDeps:{
        esbuildOptions:{
            plugins:[
                //esbuildCommonjs(['shaka-player'])
            ]
        }
    }
})
