import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages base URL
  base: process.env.NODE_ENV === 'production' ? '/sandboxjs/' : '/',
  // Standard app build - bundles everything into chunks
  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging
    sourcemap: true,

    // Minify the output
    minify: 'terser',

    // Rollup options
    rollupOptions: {
      output: {
        // Create separate chunks for better caching
        manualChunks: {
          // Vendor chunk for external libraries
          vendor: ['src/editors/codemirror.js'],
          // Core engine chunk
          core: [
            'src/core/sandbox.js',
            'src/core/console.js',
            'src/core/events.js'
          ]
        }
      }
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true
  },

  // Handle static assets
  publicDir: 'public'
});