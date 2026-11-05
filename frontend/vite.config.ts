import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The deployment workflow reads the path from GitHub Pages: / for a custom
  // domain, or /<repository-name>/ for a default project site.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-slug'],
          'content-parser': ['yaml'],
        },
      },
    },
  },
})
