const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from landing-page directory for root routes
app.use('/assets', express.static(path.join(__dirname, 'landing-page/assets')));
app.use('/lib', express.static(path.join(__dirname, 'landing-page/lib')));

// Serve static files from policy-site directory for policy routes
app.use('/policy-site/css', express.static(path.join(__dirname, 'policy-site/css')));
app.use('/policy-site/js', express.static(path.join(__dirname, 'policy-site/js')));
app.use('/policy-site/images', express.static(path.join(__dirname, 'policy-site/images')));

// Route: Landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing-page/index.html'));
});

// Route: Policy site pages at /policy-site/pages/
app.get('/policy-site/pages/application-rules', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy-site/pages/application-rules.html'));
});

app.get('/policy-site/pages/cookie-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy-site/pages/cookie-policy.html'));
});

app.get('/policy-site/pages/user-agreement', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy-site/pages/user-agreement.html'));
});

// Route: Policy site main page (optional)
app.get('/policy-site', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy-site/index.html'));
});

// Route: Handle .html extension for policy pages (optional convenience)
app.get('/policy-site/pages/:page.html', (req, res) => {
  const page = req.params.page;
  const allowedPages = ['application-rules', 'cookie-policy', 'user-agreement'];
  
  if (allowedPages.includes(page)) {
    res.sendFile(path.join(__dirname, 'policy-site/pages', `${page}.html`));
  } else {
    res.status(404).send('Page not found');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>Available routes:</p>
    <ul>
      <li><a href="/">Landing Page (localhost:3001/)</a></li>
      <li><a href="/policy-site">Policy Site Home</a></li>
      <li><a href="/policy-site/pages/application-rules">Application Rules</a></li>
      <li><a href="/policy-site/pages/cookie-policy">Cookie Policy</a></li>
      <li><a href="/policy-site/pages/user-agreement">User Agreement</a></li>
    </ul>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyNewOne Publisher Website running on http://localhost:${PORT}`);
  console.log('📍 Available routes:');
  console.log(`   Landing Page: http://localhost:${PORT}/`);
  console.log(`   Policy Site:  http://localhost:${PORT}/policy-site`);
  console.log(`   Policy Pages:`);
  console.log(`     - http://localhost:${PORT}/policy-site/pages/application-rules`);
  console.log(`     - http://localhost:${PORT}/policy-site/pages/cookie-policy`);
  console.log(`     - http://localhost:${PORT}/policy-site/pages/user-agreement`);
  console.log('');
  console.log('💡 Ready for COAD AdSDK integration!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MyNewOne Publisher Website...');
  process.exit(0);
});
