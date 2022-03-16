const {defineConfig} = require('vite')
const {resolve} = require('path')

module.exports = defineConfig({
  base: '',
  build: {
    exclude: [
      'public/p/chunk**',
    ],
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        player: resolve(__dirname, 'p/index.html'),
        embed: resolve(__dirname, 'p/embed.js'),
      },
      output: {
        entryFileNames: `p/[name].js`,
        chunkFileNames: `p/[name].js`,
        assetFileNames: `p/[name].[ext]`
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: []
    }
  }
})
