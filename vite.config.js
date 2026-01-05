import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'PjCltWidget',
      fileName: () => 'widget.js',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.[ext]',
        intro: 'var process = { env: { NODE_ENV: "production" } };',
      },
    },
  },
})
