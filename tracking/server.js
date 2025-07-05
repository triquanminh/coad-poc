const express = require('express');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;

// Configure DynamoDB client for local development
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000', // DynamoDB Local endpoint
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// 1x1 transparent GIF in base64
const gifBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'COAD Tracking Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Track impression endpoint
app.get('/track/impression', async (req, res) => {
  try {
    const adId = req.query.adId || 'unknown';
    const slot = req.query.slot || 'unknown';
    const publisherId = req.query.publisherId || 'unknown';
    
    // Get client information
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const refererUrl = req.headers['referer'] || req.headers['referrer'] || 'unknown';
    
    const timestamp = new Date().toISOString();
    const impressionId = uuidv4();

    console.log(`[IMPRESSION] AdId: ${adId}, Slot: ${slot}, Publisher: ${publisherId}, IP: ${ip}`);

    // Prepare DynamoDB item
    const impressionData = {
      impressionId: impressionId,        // Primary key
      timestamp: timestamp,              // Sort key
      adId: adId,
      slot: slot,
      publisherId: publisherId,
      refererUrl: refererUrl,
      ip: ip,
      userAgent: userAgent,
      createdAt: timestamp
    };

    // Write to DynamoDB
    const putCommand = new PutCommand({
      TableName: 'AdImpressionEvents',
      Item: impressionData
    });

    await ddbDocClient.send(putCommand);
    
    console.log(`[IMPRESSION] Successfully logged impression: ${impressionId}`);

    // Return 1x1 transparent GIF
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Length': '43',
    });
    
    const gifBuffer = Buffer.from(gifBase64, 'base64');
    res.send(gifBuffer);

  } catch (error) {
    console.error('[IMPRESSION ERROR]', error);
    
    // Still return the pixel even if logging fails
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Content-Length': '43',
    });
    
    const gifBuffer = Buffer.from(gifBase64, 'base64');
    res.send(gifBuffer);
  }
});

// Get impression stats (for debugging/monitoring)
app.get('/stats', async (req, res) => {
  try {
    // This is a simple endpoint for monitoring
    // In production, you might want to implement proper aggregation
    res.json({
      status: 'tracking_active',
      timestamp: new Date().toISOString(),
      message: 'Tracking server is operational'
    });
  } catch (error) {
    console.error('[STATS ERROR]', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`COAD Tracking Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET  /health - Health check');
  console.log('- GET  /track/impression - Track ad impression (returns 1x1 pixel)');
  console.log('- GET  /stats - Get tracking stats');
  console.log('');
  console.log('Make sure DynamoDB Local is running on port 8000');
  console.log('Run: npm run start-dynamodb');
});
