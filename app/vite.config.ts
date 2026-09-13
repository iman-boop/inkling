import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the same build works at a domain root (Vercel,
  // Netlify) and under a subpath (GitHub Pages' /<repo>/) without rebuilding.
  base: './',
  server: { host: true, port: 5173 },
})
