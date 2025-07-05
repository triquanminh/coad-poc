# COAD Tracking System Setup Guide

This guide will help you set up the complete COAD tracking system with DynamoDB Local for ad impression tracking.

## Overview

The COAD tracking system consists of:

1. **COAD Tracking Server** (`coad/coad-tracking/`) - Node.js server that handles impression tracking
2. **COAD API Server** (`coad/api/`) - Updated to include tracking pixel URLs in ad configurations  
3. **COAD Tag** (`coad-tag/`) - Updated to embed tracking pixels in ad iframes
4. **DynamoDB Local** - Local database for storing impression data

## Architecture

```
Publisher Website
    ↓ (loads ad)
COAD Tag → COAD API Server → Returns ad config with trackingPixel URL
    ↓ (renders ad with pixel)
Ad Iframe → COAD Tracking Server → Logs to DynamoDB
```

## Setup Instructions

### 1. Install COAD Tracking Server

```bash
# Navigate to tracking server directory
cd coad/coad-tracking

# Install dependencies
npm install

# Install DynamoDB Local
npm run install-dynamodb
```

### 2. Start DynamoDB Local

```bash
# Start DynamoDB Local (runs on port 8000)
npm run start-dynamodb
```

Keep this terminal open - DynamoDB Local needs to stay running.

### 3. Setup Database Tables

In a new terminal:

```bash
cd coad/coad-tracking

# Create the AdImpressionEvents table
npm run setup-dynamodb
```

### 4. Start COAD Tracking Server

```bash
# Start tracking server (runs on port 3002)
npm start

# Or for development with auto-reload
npm run dev
```

### 5. Start COAD API Server

In another terminal:

```bash
cd coad/api

# Start API server (runs on port 8080)
npm start
```

### 6. Test the System

```bash
cd coad/coad-tracking

# Run automated tests
npm test

# Or test impression tracking manually
npm run test-impression
```

## System Integration

### COAD API Server Changes

The API server now includes `trackingPixel` URLs in ad configurations:

```javascript
// Example ad configuration response
{
  "id": "ad_pub123_1_1234567890",
  "publisherId": "pub123",
  "placement": "header",
  "imageUrl": "https://example.com/ad.jpg",
  "clickUrl": "https://example.com/click",
  "trackingPixel": "http://localhost:3002/track/impression?adId=ad_pub123_1_1234567890&slot=header&publisherId=pub123"
}
```

### COAD Tag Changes

The ad renderer now embeds tracking pixels in ad iframes:

```html
<!-- Added to ad iframe body -->
<img src="http://localhost:3002/track/impression?adId=xyz&slot=header&publisherId=abc"
     width="1" height="1" style="display:none;" alt="." />
```

## Database Schema

### AdImpressionEvents Table

- **Primary Key**: `impressionId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**: `adId`, `slot`, `publisherId`, `refererUrl`, `ip`, `userAgent`, `createdAt`
- **Indexes**: `AdIdIndex`, `PublisherIdIndex`

## API Endpoints

### COAD Tracking Server (Port 3002)

- `GET /health` - Health check
- `GET /track/impression` - Track impression (returns 1x1 pixel)
- `GET /stats` - Get tracking statistics

### COAD API Server (Port 8080)

- `GET /api/bot/config/:publisherId` - Get publisher config (now includes trackingPixel)

## Testing the Complete Flow

1. **Start all services**:
   - DynamoDB Local (port 8000)
   - COAD Tracking Server (port 3002)
   - COAD API Server (port 8080)

2. **Test impression tracking**:
   ```bash
   # This should return a 1x1 transparent GIF and log to DynamoDB
   curl -v "http://localhost:3002/track/impression?adId=test_123&slot=header&publisherId=pub_456"
   ```

3. **Test ad configuration**:
   ```bash
   # This should return config with trackingPixel URLs
   curl "http://localhost:8080/api/bot/config/your_publisher_id"
   ```

4. **Test complete integration**:
   - Load a publisher website with COAD tag
   - Verify ads load with tracking pixels
   - Check DynamoDB for impression records

## Troubleshooting

### DynamoDB Local Issues
- Ensure Java 8+ is installed
- Check if port 8000 is available
- Verify DynamoDB Local files are extracted properly

### Tracking Server Issues  
- Check if port 3002 is available
- Verify DynamoDB Local is running
- Check server logs for connection errors

### Integration Issues
- Verify all servers are running on correct ports
- Check CORS configuration for cross-origin requests
- Ensure tracking pixel URLs are properly formatted

## Production Deployment

For production:

1. **Replace DynamoDB Local** with AWS DynamoDB
2. **Update AWS credentials** in tracking server
3. **Configure proper CORS** origins
4. **Add authentication/rate limiting**
5. **Set up monitoring and alerting**
6. **Use HTTPS** for tracking pixel URLs

## Monitoring

Monitor impression data by querying DynamoDB:

```javascript
// Example: Get impressions for a specific ad
const params = {
  TableName: 'AdImpressionEvents',
  IndexName: 'AdIdIndex',
  KeyConditionExpression: 'adId = :adId',
  ExpressionAttributeValues: {
    ':adId': 'your_ad_id'
  }
};
```

The tracking system is now ready for development and testing!

## Git Configuration

The following files are automatically ignored by git (already configured in `.gitignore`):

- `coad/coad-tracking/dynamodb-local/` - DynamoDB Local installation files
- `coad/coad-tracking/shared-local-instance.db` - Local database files
- `coad/coad-tracking/node_modules/` - Node.js dependencies

**What to commit:**
- All source code files (`server.js`, `package.json`, etc.)
- Setup scripts (`scripts/setup-dynamodb.js`, etc.)
- Documentation files (`README.md`)

**What NOT to commit:**
- DynamoDB Local binaries and JAR files
- Local database files
- Node modules
- Environment-specific configuration

Each developer should run the setup process locally:
```bash
cd coad/coad-tracking
npm install
npm run install-dynamodb
npm run setup-dynamodb
```
