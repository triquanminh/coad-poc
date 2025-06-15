const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 4001

// Middleware
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))

// Serve the AdSDK JavaScript file
app.get('/adsdk.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript')
  res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  res.sendFile(path.join(__dirname, 'adsdk.js'))
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'COAD AdSDK',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// SDK configuration endpoint
app.get('/config/:publisherId', (req, res) => {
  const { publisherId } = req.params
  
  // In a real implementation, this would fetch from the API
  res.json({
    publisherId,
    version: '1.0.0',
    apiUrl: 'http://localhost:8080/api',
    refreshInterval: 10000,
    enabled: true
  })
})

app.listen(PORT, () => {
  console.log(`AdSDK server running on http://localhost:${PORT}`)
  console.log('SDK available at: http://localhost:4001/adsdk.js')
})

// Keep the process alive
process.on('SIGINT', () => {
  console.log('AdSDK server shutting down...')
  process.exit(0)
})
