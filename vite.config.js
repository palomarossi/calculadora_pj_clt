import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ]

  // Build do widget (UMD) para embed.
  if (mode === 'widget') {
    return {
      plugins,
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
    }
  }

  // Build padrão (app) para deploy no Vercel: gera index.html em dist/.
  return {
    plugins,
    build: {
      outDir: 'dist',
    },
  }
})
