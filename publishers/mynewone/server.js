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
app.use('/landing-page', express.static(path.join(__dirname, 'landing-page')));

// Route: Main landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route: Simple policy subpages
app.get('/user-agreement', (req, res) => {
  res.sendFile(path.join(__dirname, 'user-agreement.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

app.get('/application-rules', (req, res) => {
  res.sendFile(path.join(__dirname, 'application-rules.html'));
});

app.get('/cookie-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'cookie-policy.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>Available routes:</p>
    <ul>
      <li><a href="/">Home Page (localhost:3001/)</a></li>
      <li><a href="/user-agreement">User Agreement</a></li>
      <li><a href="/privacy-policy">Privacy Policy</a></li>
      <li><a href="/application-rules">Application Rules</a></li>
      <li><a href="/cookie-policy">Cookie Policy</a></li>
    </ul>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyNewOne Publisher Website running on http://localhost:${PORT}`);
  console.log('📍 Available routes:');
  console.log(`   Home Page:        http://localhost:${PORT}/`);
  console.log(`   User Agreement:   http://localhost:${PORT}/user-agreement`);
  console.log(`   Privacy Policy:   http://localhost:${PORT}/privacy-policy`);
  console.log(`   Application Rules: http://localhost:${PORT}/application-rules`);
  console.log(`   Cookie Policy:    http://localhost:${PORT}/cookie-policy`);
  console.log('');
  console.log('💡 Ready for COAD AdSDK integration!');
  console.log('🎯 Script injection: Only on main page (/) - applies to all subpages');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MyNewOne Publisher Website...');
  process.exit(0);
});
