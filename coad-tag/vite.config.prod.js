import { defineConfig } from 'vite'

export default defineConfig({
  // Base URL for CloudFront deployment
  base: '/',

  // Public directory for static assets
  publicDir: 'public',
  
  // Build configuration optimized for CloudFront
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Copy public directory for preview
    copyPublicDir: true,
    
    // No sourcemaps in production for security and size
    sourcemap: false,
    
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    
    // Library build for Tag
    lib: {
      entry: 'src/index.js',
      name: 'CoAdTag',
      fileName: () => 'coad-tag.js',
      formats: ['iife']
    },
    
    rollupOptions: {
      output: {
        // Single file output for easy CloudFront deployment
        entryFileNames: 'coad-tag.js',

        // Inline all CSS and assets
        inlineDynamicImports: true,

        // Optimize for size
        compact: true,

        // Remove comments
        banner: '/* CoAd Tag - Optimized for CloudFront */',
      }
    },
    
    // Target modern browsers for smaller bundle
    target: ['es2018', 'chrome70', 'firefox65', 'safari12'],
    
    // Inline small assets
    assetsInlineLimit: 8192,
    
    // Disable CSS code splitting for single file output
    cssCodeSplit: false,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 100,
  },
  
  // Plugins for production (no legacy plugin for library mode)
  plugins: [],
  
  // Production-specific defines
  define: {
    __DEV__: false,
    __PROD__: true,
    'process.env.NODE_ENV': '"production"',
  },
  
  // CSS optimization
  css: {
    postcss: {
      plugins: [
        // Add autoprefixer and cssnano for production
      ]
    }
  },
  
  // Optimization for CloudFront
  optimizeDeps: {
    include: [],
  },
  
  // Server config for preview
  preview: {
    port: 4001,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  }
})
