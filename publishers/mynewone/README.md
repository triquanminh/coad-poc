# MyNewOne Publisher Website

A complete publisher website with landing page and policy site, hosted on localhost:3001 with COAD AdSDK integration.

## 🌐 Website Structure

### Landing Page (localhost:3001/)
- **URL**: http://localhost:3001/
- **Content**: Main marketing website for MyNewOne social platform
- **Features**: 
  - Hero section with app download links
  - Feature showcase (Post, Comment, Poll)
  - About company section
  - Contact form
  - Multi-language support (EN/VN/TH)

### Policy Site (localhost:3001/policy-site/)
- **Main Policy Page**: http://localhost:3001/policy-site/
- **Individual Policy Pages**:
  - **User Agreement**: http://localhost:3001/policy-site/pages/user-agreement
  - **Cookie Policy**: http://localhost:3001/policy-site/pages/cookie-policy
  - **Application Rules**: http://localhost:3001/policy-site/pages/application-rules

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- COAD system running (API server on port 8080, AdSDK on port 4001)

### Installation & Running
```bash
# Navigate to the publisher directory
cd publishers/mynewone

# Install dependencies
npm install

# Start the server
npm start
```

The website will be available at:
- **Landing Page**: http://localhost:3001/
- **Policy Site**: http://localhost:3001/policy-site/

## 🔧 COAD AdSDK Integration

All pages include the COAD AdSDK with **zero-configuration auto-detection**:

```html
<!-- COAD AdSDK Integration (Auto-Detection) -->
<script src="http://localhost:4001/adsdk.js" async></script>
```

### How It Works
1. **Auto-Detection**: SDK automatically detects the domain `localhost:3001`
2. **API Lookup**: Calls COAD API to find publisher configuration
3. **Ad Placement**: Automatically loads and displays ads in configured locations
4. **Zero Maintenance**: No Publisher IDs or manual configuration needed

## 📁 File Structure

```
publishers/mynewone/
├── package.json              # Node.js dependencies and scripts
├── server.js                 # Express server for hosting
├── README.md                 # This file
├── landing-page/             # Main landing page
│   ├── index.html           # Landing page HTML
│   ├── assets/              # CSS, JS, images for landing page
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── lib/                 # External libraries
└── policy-site/             # Policy pages
    ├── index.html           # Main privacy policy page
    ├── css/                 # Policy site styles
    ├── js/                  # Policy site scripts
    ├── images/              # Policy site images
    └── pages/               # Individual policy pages
        ├── user-agreement.html
        ├── cookie-policy.html
        └── application-rules.html
```

## 🎯 COAD Integration Benefits

### For Publishers:
- ✅ **One-Line Integration**: Just add the script tag
- ✅ **Auto-Detection**: No Publisher IDs needed
- ✅ **Zero Configuration**: Works immediately
- ✅ **Dynamic Updates**: New ad placements work without code changes

### For Users:
- 🎯 **Relevant Ads**: Contextual advertising based on content
- ⚡ **Fast Loading**: Non-blocking, asynchronous ad loading
- 📱 **Responsive**: Works on all devices and screen sizes

## 🔗 Available Routes

| Route | Description | File |
|-------|-------------|------|
| `/` | Landing page | `landing-page/index.html` |
| `/policy-site` | Main policy page | `policy-site/index.html` |
| `/policy-site/pages/user-agreement` | User agreement | `policy-site/pages/user-agreement.html` |
| `/policy-site/pages/cookie-policy` | Cookie policy | `policy-site/pages/cookie-policy.html` |
| `/policy-site/pages/application-rules` | Application rules | `policy-site/pages/application-rules.html` |

## 🛠️ Technical Details

### Server Configuration
- **Framework**: Express.js
- **Port**: 3001
- **Static Files**: Served from appropriate directories
- **Routing**: Custom routes for policy pages

### COAD Integration
- **AdSDK URL**: http://localhost:4001/adsdk.js
- **Auto-Detection**: Domain-based publisher lookup
- **API Integration**: Connects to COAD API on port 8080

## 📊 Next Steps

1. **Register Website**: Go to http://localhost:4000/publisher and register `http://localhost:3001`
2. **Configure Ad Placements**: Select where ads should appear on your pages
3. **Test Integration**: Visit your website to see ads automatically appear
4. **Monitor Performance**: Use the COAD dashboard to track ad performance

## 🎉 Ready for Monetization!

Your MyNewOne publisher website is now ready for COAD ad monetization with zero-configuration AdSDK integration!
