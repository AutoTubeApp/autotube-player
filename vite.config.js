const { defineConfig } = require('vite')
//import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
const { resolve } = require('path')

module.exports = defineConfig({
    base: '',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                player: resolve(__dirname, 'p/index.html'),
                embed: resolve(__dirname, 'embed.js'),
            },
            output: {
                entryFileNames: `p/[name].js`,
                chunkFileNames: `p/[name].js`,
                assetFileNames: `p/[name].[ext]`
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
