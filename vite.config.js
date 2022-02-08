const { defineConfig } = require('vite')
const { resolve } = require('path')

module.exports = defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                embed: resolve(__dirname, 'embed.html'),
                embedDyn: resolve(__dirname, 'embed-dyn.html'),
            },
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    }
})
