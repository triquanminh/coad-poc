# CoAd Tag - Vite.js Project

A modern JavaScript tag for ad serving, built with Vite.js and optimized for AWS CloudFront deployment.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:4001/` to see the development environment.

### Building

```bash
# Build for development/testing (uses development config)
npm run build

# Build for production deployment (uses production config)
npm run build:prod

# Preview any build locally
npm run preview
```

## 📁 Project Structure

```
public-js/coad-tag/
├── src/                     # Source code
│   ├── index.js            # Main Tag entry point
│   ├── config.js           # Configuration constants & environment variables
│   ├── ad-renderer.js      # Ad rendering logic
│   ├── analytics.js        # Analytics tracking
│   ├── api-client.js       # API communication
│   ├── container-manager.js # DOM container management
│   └── utils.js            # Utility functions
├── public/                  # Static assets
│   └── index.html          # Public test page template
├── dist/                   # Built files (generated)
│   ├── coad-tag.js         # Tag bundle (development or production)
│   └── index.html          # Built test page
├── .env.development        # Development environment variables
├── index.html              # Development test page
├── vite.config.js          # Main Vite configuration (development & production modes)
├── vite.config.prod.js     # Production-specific optimized config
├── package.json            # Project configuration & dependencies
└── README.md               # This file
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for development/testing (uses development config) |
| `npm run build:prod` | Build for production deployment (uses production config) |
| `npm run clean` | Clean dist directory |
| `npm run preview` | Preview any build locally |

## 🌍 Environment Configuration

### Development (.env.development)
```env
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEBUG=true
VITE_COAD_TAG_VERSION=0.1.0-dev
```

### Production (.env.production)
```env
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.coad.com/api
VITE_DEBUG=false
VITE_COAD_TAG_VERSION=0.1.0
```

## 🔧 Features

### Development (`npm run dev` & `npm run build`)
- ⚡ Hot Module Replacement (HMR) with `npm run dev`
- 🗺️ Source maps for debugging
- 🌐 CORS headers for cross-origin testing
- 🔍 Debug mode with detailed logging
- 📱 Responsive development interface
- 🔧 Uses development environment variables

### Production (`npm run build:prod`)
- 📦 Optimized bundle (~7KB gzipped)
- 🗜️ Aggressive minification and compression
- 🌳 Tree-shaking for smaller size
- 🚫 No source maps for security
- ⚡ Fast loading and execution
- 🌍 Uses production environment variables

## 📖 Integration

### Basic Integration
```html
<!-- Running Development Build Locally -->
<script src="http://localhost:4001/src/index.js" type="module" async></script>

<!-- Running Production Build Locally -->
<script src="http://localhost:4001/coad-tag.dev.js" async></script>

<!-- Production Deployment -->
<script src="https://your-cloudfront-url.com/coad-tag.js" async></script>
```

> **Note**:
> - **Development Server** (`npm run dev`): The `type="module"` attribute is required because Vite serves source files as ES modules
> - **Development Build** (`npm run build`): Uses development config but outputs a single bundled file
> - **Production Build** (`npm run build:prod`): Uses production config with maximum optimization

### Configuration
```javascript
window.COADConfig = {
  debug: false,
  publisherId: 'your-publisher-id',
  placements: ['.ad-placement', '#sidebar-ad']
};
```

### API Usage
```javascript
// Access Tag instance
const tag = window.CoAd.tag;

// Get status
const status = tag.getStatus();

// Refresh ads
tag.refresh();

// Reinitialize
tag.forceReinit();

// Destroy Tag
tag.destroy();
```

## �📊 Performance

- **Bundle Size**: ~12KB gzipped
- **Load Time**: <100ms target
- **Browser Support**: ES2015+ (Chrome 58+, Firefox 57+, Safari 11+)
- **Cache Strategy**: 1 hour TTL for Tag, 1 year for assets

## 🔍 Debugging

Enable debug mode for development:
```javascript
window.COADConfig = { debug: true };
```

This enables:
- Console logging
- Detailed error messages
- Performance metrics
- Network request logging

## 🛡️ Security

- No source maps in production
- Minified code
- HTTPS-only delivery
- Content Security Policy ready
- XSS protection headers

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Review console logs with debug mode enabled
- Contact the development team
