import { defineConfig } from 'vite'

export default defineConfig({
  // Public directory for static assets
  publicDir: 'public',
  
  server: {
    port: 3000,
    open: true
  },
  
  build: {
    target: 'ES2020',
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate source maps for better debugging
    sourcemap: false,
    // Optimize build (using esbuild instead of terser)
    minify: 'esbuild',
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000
  }
})
