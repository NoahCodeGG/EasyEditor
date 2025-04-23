import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EasyEditorCustomComponent',
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@easy-editor/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@easy-editor/core': 'EasyEditorCore',
        },
      },
    },
  },
})
