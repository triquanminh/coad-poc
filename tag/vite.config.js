import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development'
  const isProd = mode === 'production'
  
  return {
    // Base URL for assets - important for CloudFront deployment
    base: isProd ? '/' : '/',
    
    // Build configuration
    build: {
      // Output directory
      outDir: 'dist',
      
      // Clean output directory before build
      emptyOutDir: true,
      
      // Generate sourcemaps for debugging
      sourcemap: isDev ? 'inline' : false,
      
      // Minification
      minify: isProd ? 'terser' : false,
      
      // Terser options for production
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
      } : {},
      
      // Library build configuration for Tag
      lib: {
        entry: 'src/index.js',
        name: 'CoAdTag',
        fileName: (format) => `coad-tag.${format}.js`,
        formats: ['iife'] // IIFE format for direct browser inclusion
      },
      
      // Rollup options
      rollupOptions: {
        // External dependencies (none for this Tag)
        external: [],
        
        output: {
          // Global variables for IIFE format
          globals: {},
          
          // Asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.names ? assetInfo.names[0].split('.') : assetInfo.name?.split('.') || ['asset']
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
          
          // Chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          
          // Entry file names
          entryFileNames: isProd ? 'coad-tag.js' : 'coad-tag.dev.js',
        }
      },
      
      // Target browsers
      target: ['es2015', 'chrome58', 'firefox57', 'safari11'],
      
      // CSS code splitting
      cssCodeSplit: false,
      
      // Asset inline threshold (in bytes)
      assetsInlineLimit: 4096,
    },
    
    // Development server configuration
    server: {
      port: 4001,
      host: true, // Listen on all addresses
      cors: true,
      
      // Headers for development
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
    
    // Preview server configuration
    preview: {
      port: 4001,
      host: true,
      cors: true,
    },
    
    // Plugins
    plugins: [
      // Only use legacy plugin for non-library builds
      ...(command === 'serve' ? [
        legacy({
          targets: ['defaults', 'not IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
          renderLegacyChunks: false,
        })
      ] : [])
    ],
    
    // Define global constants
    define: {
      __DEV__: isDev,
      __PROD__: isProd,
    },
    
    // CSS configuration
    css: {
      // CSS modules
      modules: false,
      
      // PostCSS configuration
      postcss: {},
      
      // Preprocessor options
      preprocessorOptions: {},
    },
    
    // Resolve configuration
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    
    // Optimization
    optimizeDeps: {
      include: [],
      exclude: [],
    },
  }
})
