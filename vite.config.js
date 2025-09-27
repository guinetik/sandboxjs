import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

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
  publicDir: 'public',

  // Build plugins
  plugins: [
    {
      name: 'copy-sandbox-template',
      writeBundle() {
        // Copy sandbox.html to assets folder for production
        const srcPath = 'src/ui/sandbox.html';
        const destPath = 'dist/assets/sandbox.html';

        try {
          // Create assets directory
          mkdirSync(dirname(destPath), { recursive: true });
          // Copy file
          copyFileSync(srcPath, destPath);
          console.log('✅ Copied sandbox.html to dist/assets/');
        } catch (error) {
          console.error('❌ Failed to copy sandbox.html:', error);
        }
      }
    }
  ]
});