const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// SPA Route: Serve index.html for all routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyNewOne Publisher Website (SPA) running on http://localhost:${PORT}`);
  console.log('📍 Available routes (client-side routing):');
  console.log(`   Home Page:        http://localhost:${PORT}/`);
  console.log(`   User Agreement:   http://localhost:${PORT}/user-agreement`);
  console.log(`   Privacy Policy:   http://localhost:${PORT}/privacy-policy`);
  console.log(`   Application Rules: http://localhost:${PORT}/application-rules`);
  console.log(`   Cookie Policy:    http://localhost:${PORT}/cookie-policy`);
  console.log('');
  console.log('💡 Ready for COAD AdSDK integration!');
  console.log('🎯 SPA Mode: Script injected once in index.html - persists across all navigation');
  console.log('🔄 Client-side routing: All routes serve the same index.html with JavaScript navigation');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MyNewOne Publisher Website...');
  process.exit(0);
});
