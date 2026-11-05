import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub project Pages sites are served from /<repository-name>/ rather than
  // the domain root. The deployment workflow supplies that path at build time.
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
