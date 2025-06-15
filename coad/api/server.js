const express = require('express')
const cors = require('cors')
const axios = require('axios')
const cheerio = require('cheerio')
const db = require('./database')

const app = express()
const PORT = 8080

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint for publisher websites (no registration)
app.post('/api/health-check', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    console.log(`Performing health check for: ${url}`)

    // Measure response time
    const startTime = Date.now()
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'COAD-HealthCheck/1.0'
      }
    })
    const responseTime = Date.now() - startTime

    // Parse HTML to analyze DOM structure
    const $ = cheerio.load(response.data)

    // Count DOM elements
    const domElements = $('*').length
    const pageTitle = $('title').text() || 'No title found'
    const metaDescription = $('meta[name="description"]').attr('content') || 'No description found'

    // Analyze page structure and suggest ad placements
    const suggestions = []

    // Check for common elements
    if ($('header').length > 0) {
      suggestions.push({
        selector: 'header',
        description: 'Header area - good for banner ads',
        priority: 'high'
      })
    }

    if ($('.content, #content, main').length > 0) {
      suggestions.push({
        selector: '.content, #content, main',
        description: 'Main content area - suitable for inline ads',
        priority: 'high'
      })
    }

    if ($('footer').length > 0) {
      suggestions.push({
        selector: 'footer',
        description: 'Footer area - good for sticky ads',
        priority: 'medium'
      })
    }

    if ($('.sidebar, #sidebar, aside').length > 0) {
      suggestions.push({
        selector: '.sidebar, #sidebar, aside',
        description: 'Sidebar - perfect for vertical ads',
        priority: 'high'
      })
    }

    if ($('nav, .nav, .navigation').length > 0) {
      suggestions.push({
        selector: 'nav, .nav, .navigation',
        description: 'Navigation area - suitable for small banner ads',
        priority: 'low'
      })
    }

    // Check for article content
    if ($('article, .article, .post').length > 0) {
      suggestions.push({
        selector: 'article, .article, .post',
        description: 'Article content - good for in-content ads',
        priority: 'high'
      })
    }

    // Generic container suggestions
    if ($('.container, .wrapper').length > 0) {
      suggestions.push({
        selector: '.container, .wrapper',
        description: 'Container elements - flexible ad placement',
        priority: 'medium'
      })
    }

    const healthStatus = response.status === 200 ? 'healthy' : 'unhealthy'

    const healthCheckResult = {
      url,
      status: healthStatus,
      responseTime,
      domElements,
      suggestions,
      timestamp: new Date().toISOString(),
      pageTitle,
      metaDescription
    }

    res.json(healthCheckResult)

  } catch (error) {
    console.error('Health check failed:', error.message)

    res.status(500).json({
      url,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Register a new publisher (replaces website registration)
app.post('/api/publisher/register', async (req, res) => {
  const { url, healthCheckData, publisherId, placements } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    console.log(`Registering publisher for website: ${url}`)

    // Check for duplicate URL
    const existingWebsite = await db.getWebsiteByUrl(url)
    if (existingWebsite) {
      return res.status(409).json({
        error: 'Publisher already registered for this website',
        existingPublisher: {
          publisherId: existingWebsite.publisher_id,
          websiteId: existingWebsite.id,
          url: existingWebsite.url,
          createdAt: existingWebsite.created_at
        }
      })
    }

    // Use provided health check data or perform new health check
    let healthData = healthCheckData
    if (!healthData) {
      // Perform health check if not provided
      const healthCheckResponse = await axios.post('http://localhost:8080/api/health-check', { url })
      healthData = healthCheckResponse.data
    }

    // Register the publisher (creates website record)
    const websiteData = await db.registerWebsite({
      url,
      title: healthData.pageTitle || 'No title found',
      description: healthData.metaDescription || 'No description found',
      healthStatus: healthData.status,
      responseTime: healthData.responseTime,
      domElements: healthData.domElements
    })

    // Record initial health check
    await db.recordHealthCheck(websiteData.id, {
      status: healthData.status,
      responseTime: healthData.responseTime,
      domElements: healthData.domElements
    })

    // Add placements if provided
    if (placements && placements.length > 0) {
      for (const placement of placements) {
        await db.addAdPlacement(websiteData.id, {
          selector: placement,
          description: `Ad placement for ${placement}`,
          priority: 'medium'
        })
      }
    }

    console.log(`Publisher registered successfully: ${websiteData.publisherId} for ${url}`)

    res.json({
      success: true,
      publisherId: websiteData.publisherId,
      websiteId: websiteData.id,
      url: url,
      title: healthData.pageTitle,
      description: healthData.metaDescription,
      healthStatus: healthData.status,
      responseTime: healthData.responseTime,
      domElements: healthData.domElements,
      message: 'Publisher registered successfully'
    })

  } catch (error) {
    console.error('Error registering publisher:', error.message)
    res.status(500).json({ error: 'Failed to register publisher' })
  }
})

// Get all publishers (replaces /api/websites)
app.get('/api/publishers', async (req, res) => {
  try {
    const websites = await db.getAllWebsites()
    const publishers = websites.map(website => ({
      publisherId: website.publisher_id,
      websiteId: website.id,
      url: website.url,
      title: website.title,
      description: website.description,
      status: website.status,
      healthStatus: website.health_status,
      responseTime: website.response_time,
      domElements: website.dom_elements,
      createdAt: website.created_at,
      updatedAt: website.updated_at
    }))
    res.json(publishers)
  } catch (error) {
    console.error('Error fetching publishers:', error.message)
    res.status(500).json({ error: 'Failed to fetch publishers' })
  }
})

// Delete publisher by ID
app.delete('/api/publisher/:publisherId', async (req, res) => {
  const { publisherId } = req.params

  try {
    const website = await db.getWebsiteByPublisherId(publisherId)

    if (!website) {
      return res.status(404).json({ error: 'Publisher not found' })
    }

    // Delete the website by publisher ID (this will cascade delete placements and health checks)
    const result = await db.deleteWebsiteByPublisherId(publisherId)

    if (result.changes > 0) {
      console.log(`Publisher deleted: ${publisherId} (Website: ${website.url})`)
      res.json({
        success: true,
        message: 'Publisher and all associated data deleted successfully',
        deletedPublisher: {
          publisherId: website.publisher_id,
          websiteId: website.id,
          url: website.url
        }
      })
    } else {
      res.status(404).json({ error: 'Publisher not found' })
    }
  } catch (error) {
    console.error('Error deleting publisher:', error.message)
    res.status(500).json({ error: 'Failed to delete publisher' })
  }
})

// Add ad placement for a publisher
app.post('/api/publisher/:publisherId/placements', async (req, res) => {
  const { publisherId } = req.params
  const { selector, description, priority } = req.body

  if (!selector) {
    return res.status(400).json({ error: 'Selector is required' })
  }

  try {
    // Get website by publisher ID
    const website = await db.getWebsiteByPublisherId(publisherId)
    if (!website) {
      return res.status(404).json({ error: 'Publisher not found' })
    }

    const placement = await db.addAdPlacement(website.id, {
      selector,
      description,
      priority
    })

    console.log(`Ad placement added: ${selector} for publisher ${publisherId}`)
    res.json(placement)
  } catch (error) {
    console.error('Error adding ad placement:', error.message)
    res.status(500).json({ error: 'Failed to add ad placement' })
  }
})

// Get ad placements for a publisher
app.get('/api/publisher/:publisherId/placements', async (req, res) => {
  const { publisherId } = req.params

  try {
    const placements = await db.getAdPlacementsByPublisherId(publisherId)
    res.json(placements)
  } catch (error) {
    console.error('Error fetching ad placements:', error.message)
    res.status(500).json({ error: 'Failed to fetch ad placements' })
  }
})

// Remove ad placement
app.delete('/api/placement/:placementId', async (req, res) => {
  const { placementId } = req.params

  try {
    const result = await db.removeAdPlacement(placementId)
    if (result.changes > 0) {
      res.json({ success: true, message: 'Ad placement removed' })
    } else {
      res.status(404).json({ error: 'Ad placement not found' })
    }
  } catch (error) {
    console.error('Error removing ad placement:', error.message)
    res.status(500).json({ error: 'Failed to remove ad placement' })
  }
})

// Get publisher configuration by ID
app.get('/api/publisher/:publisherId', async (req, res) => {
  const { publisherId } = req.params

  try {
    const website = await db.getWebsiteByPublisherId(publisherId)

    if (!website) {
      return res.status(404).json({ error: 'Publisher not found' })
    }

    const placements = await db.getAdPlacementsByPublisherId(publisherId)

    res.json({
      publisherId: website.publisher_id,
      websiteId: website.id,
      url: website.url,
      title: website.title,
      description: website.description,
      status: website.status,
      healthStatus: website.health_status,
      responseTime: website.response_time,
      domElements: website.dom_elements,
      placements: placements.map(p => p.selector),
      placementDetails: placements,
      createdAt: website.created_at,
      updatedAt: website.updated_at
    })
  } catch (error) {
    console.error('Error fetching publisher:', error.message)
    res.status(500).json({ error: 'Failed to fetch publisher' })
  }
})



// Bot configuration endpoint (for AdSDK)
app.get('/api/bot/config/:publisherId', async (req, res) => {
  const { publisherId } = req.params

  try {
    const website = await db.getWebsiteByPublisherId(publisherId)

    if (!website) {
      return res.status(404).json({ error: 'Publisher configuration not found' })
    }

    const placements = await db.getAdPlacementsByPublisherId(publisherId)

    // Return configuration for the bot
    res.json({
      publisherId: website.publisher_id,
      website: website.url,
      placements: placements.map(p => p.selector),
      placementDetails: placements,
      adServerUrl: 'http://localhost:8080/api/ads',
      refreshInterval: 30000, // 30 seconds
      enabled: website.status === 'active'
    })
  } catch (error) {
    console.error('Error fetching bot config:', error.message)
    res.status(500).json({ error: 'Failed to fetch bot configuration' })
  }
})

// Ad serving endpoint with proper validation and error handling
app.get('/api/ads', async (req, res) => {
  const { publisherId, placement } = req.query

  try {
    console.log(`[AD REQUEST] Publisher: ${publisherId}, Placement: ${placement}`)

    // Validate required parameters
    if (!publisherId) {
      console.log('[AD REQUEST] Missing publisherId')
      return res.status(400).json({
        error: 'Publisher ID is required',
        timestamp: new Date().toISOString()
      })
    }

    if (!placement) {
      console.log('[AD REQUEST] Missing placement')
      return res.status(400).json({
        error: 'Placement is required',
        timestamp: new Date().toISOString()
      })
    }

    // Verify publisher exists (optional validation)
    try {
      const website = await db.getWebsiteByPublisherId(publisherId)
      if (!website) {
        console.log(`[AD REQUEST] Publisher not found: ${publisherId}`)
        // Still serve ad but log the issue
      } else {
        console.log(`[AD REQUEST] Verified publisher: ${publisherId} for ${website.url}`)
      }
    } catch (dbError) {
      console.log(`[AD REQUEST] Database check failed, serving ad anyway: ${dbError.message}`)
    }

    // Always return a consistent ad for reliability
    const mockAd = {
      id: `ad_${Date.now()}`,
      type: 'banner',
      content: `<div style="
        background: red;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin: 10px 0;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
      ">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">🎯 COAD Demo Ad</h3>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Placement: ${placement}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">Publisher: ${publisherId}</p>
      </div>`,
      width: 'auto',
      height: 'auto'
    }

    console.log(`[AD SERVED] Successfully served ad ${mockAd.id} to ${publisherId}`)

    // Add CORS headers for cross-origin requests
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Access-Control-Allow-Headers', 'Content-Type')

    res.json({
      success: true,
      ad: mockAd,
      publisherId,
      placement,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`[AD ERROR] Failed to serve ad: ${error.message}`)
    res.status(500).json({
      error: 'Failed to serve advertisement',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const websites = await db.getAllWebsites()
    const totalPlacements = await Promise.all(
      websites.map(w => db.getAdPlacementsByWebsiteId(w.id))
    )
    const placementCount = totalPlacements.reduce((sum, placements) => sum + placements.length, 0)

    res.json({
      status: 'connected',
      websites: websites.length,
      totalPlacements: placementCount,
      recentWebsites: websites.slice(0, 5).map(w => ({
        id: w.id,
        url: w.url,
        publisherId: w.publisher_id,
        status: w.status,
        createdAt: w.created_at
      }))
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    })
  }
})

// Admin API endpoints
// Get all publishers with detailed information (replaces admin/websites)
app.get('/api/admin/publishers', async (req, res) => {
  try {
    const websites = await db.getAllWebsites()
    const publishersWithDetails = await Promise.all(
      websites.map(async (website) => {
        const placements = await db.getAdPlacementsByWebsiteId(website.id)
        const healthHistory = await db.getHealthCheckHistory(website.id, 5)
        return {
          publisherId: website.publisher_id,
          websiteId: website.id,
          url: website.url,
          title: website.title,
          description: website.description,
          status: website.status,
          healthStatus: website.health_status,
          responseTime: website.response_time,
          domElements: website.dom_elements,
          placementCount: placements.length,
          placements: placements,
          recentHealthChecks: healthHistory,
          createdAt: website.created_at,
          updatedAt: website.updated_at
        }
      })
    )
    res.json(publishersWithDetails)
  } catch (error) {
    console.error('Error fetching publishers for admin:', error.message)
    res.status(500).json({ error: 'Failed to fetch publishers' })
  }
})

// Delete publisher by ID (admin)
app.delete('/api/admin/publishers/:publisherId', async (req, res) => {
  const { publisherId } = req.params

  try {
    const website = await db.getWebsiteByPublisherId(publisherId)
    if (!website) {
      return res.status(404).json({ error: 'Publisher not found' })
    }

    const result = await db.deleteWebsiteByPublisherId(publisherId)
    if (result.changes > 0) {
      console.log(`Admin deleted publisher: ${publisherId} (Website: ${website.url})`)
      res.json({
        success: true,
        message: 'Publisher and all associated data deleted successfully',
        deletedPublisher: {
          publisherId: website.publisher_id,
          websiteId: website.id,
          url: website.url
        }
      })
    } else {
      res.status(404).json({ error: 'Publisher not found' })
    }
  } catch (error) {
    console.error('Error deleting publisher:', error.message)
    res.status(500).json({ error: 'Failed to delete publisher' })
  }
})

// Get admin dashboard statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const websites = await db.getAllWebsites()
    const totalPlacements = await Promise.all(
      websites.map(w => db.getAdPlacementsByWebsiteId(w.id))
    )
    const placementCount = totalPlacements.reduce((sum, placements) => sum + placements.length, 0)

    const healthyWebsites = websites.filter(w => w.health_status === 'healthy').length
    const unhealthyWebsites = websites.filter(w => w.health_status === 'unhealthy').length
    const activeWebsites = websites.filter(w => w.status === 'active').length

    res.json({
      totalWebsites: websites.length,
      totalPublishers: websites.length, // 1:1 relationship
      totalPlacements: placementCount,
      healthyWebsites,
      unhealthyWebsites,
      activeWebsites,
      averageResponseTime: websites.length > 0
        ? Math.round(websites.reduce((sum, w) => sum + (w.response_time || 0), 0) / websites.length)
        : 0,
      recentWebsites: websites.slice(0, 5).map(w => ({
        id: w.id,
        url: w.url,
        publisherId: w.publisher_id,
        status: w.status,
        healthStatus: w.health_status,
        createdAt: w.created_at
      }))
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error.message)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// Health check for the API itself
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'COAD API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`COAD API server running on http://localhost:${PORT}`)
  console.log('Available endpoints:')
  console.log('- POST /api/health-check - Website health check')
  console.log('- POST /api/publisher/register - Register publisher')
  console.log('- GET  /api/publishers - Get all publishers')
  console.log('- GET  /api/publisher/:id - Get publisher config')
  console.log('- DELETE /api/publisher/:id - Delete publisher')
  console.log('- POST /api/publisher/:id/placements - Add ad placement')
  console.log('- GET  /api/publisher/:id/placements - Get ad placements')
  console.log('- GET  /api/bot/config/:id - Get bot config')
  console.log('- GET  /api/ads - Serve ads')
  console.log('- GET  /api/admin/publishers - Admin: Get all publishers')
  console.log('- DELETE /api/admin/publishers/:id - Admin: Delete publisher')
  console.log('- GET  /api/admin/stats - Admin: Dashboard statistics')
  console.log('- GET  /health - API health check')
})
