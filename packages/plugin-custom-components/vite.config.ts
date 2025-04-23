import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EasyEditorPluginCustomComponents',
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@easy-editor/core', '@easy-editor/plugin-materials-dashboard', 'fs', 'path'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@easy-editor/core': 'EasyEditorCore',
          '@easy-editor/plugin-materials-dashboard': 'EasyEditorPluginMaterialsDashboard',
        },
      },
    },
  },
})
