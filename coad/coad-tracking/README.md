# COAD Tracking Server

A Node.js server for tracking ad impressions and writing to DynamoDB.

## Features

- **Impression Tracking**: Tracks ad impressions via 1x1 transparent pixel
- **DynamoDB Integration**: Stores impression data in local DynamoDB
- **CORS Support**: Handles cross-origin requests from publisher websites
- **Health Monitoring**: Provides health check and stats endpoints

## Setup

### 1. Install Dependencies

```bash
cd coad/coad-tracking
npm install
```

### 2. Install DynamoDB Local

Download DynamoDB Local from AWS:
```bash
# Download DynamoDB Local
wget https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz
```

### 3. Start DynamoDB Local

```bash
# Start DynamoDB Local (runs on port 8000)
npm run start-dynamodb
```

### 4. Setup Database Tables

```bash
# Create the AdImpressionEvents table
npm run setup-dynamodb
```

### 5. Start Tracking Server

```bash
# Start the tracking server (runs on port 3001)
npm start

# Or for development with auto-reload
npm run dev
```

## API Endpoints

### GET /health
Health check endpoint
```
Response: { status: "healthy", service: "COAD Tracking Server", ... }
```

### GET /track/impression
Track ad impression and return 1x1 transparent pixel

**Query Parameters:**
- `adId` - The ad identifier
- `slot` - The ad slot/placement
- `publisherId` - The publisher identifier

**Example:**
```
GET /track/impression?adId=ad_123&slot=header&publisherId=pub_456
```

**Response:** 1x1 transparent GIF image

### GET /stats
Get tracking server statistics
```
Response: { status: "tracking_active", timestamp: "...", ... }
```

## Database Schema

### AdImpressionEvents Table

**Primary Key:**
- `impressionId` (String) - Unique impression identifier
- `timestamp` (String) - ISO timestamp (sort key)

**Attributes:**
- `adId` (String) - Ad identifier
- `slot` (String) - Ad placement/slot
- `publisherId` (String) - Publisher identifier  
- `refererUrl` (String) - URL where impression occurred
- `ip` (String) - Client IP address
- `userAgent` (String) - Client user agent
- `createdAt` (String) - Creation timestamp

**Global Secondary Indexes:**
- `AdIdIndex` - Query by adId + timestamp
- `PublisherIdIndex` - Query by publisherId + timestamp

## Integration

The tracking server integrates with:

1. **COAD API Server** - Provides tracking pixel URLs in ad configurations
2. **COAD Tag** - Embeds tracking pixels in ad iframes for impression tracking

## Development

```bash
# Install dependencies
npm install

# Start DynamoDB Local
npm run start-dynamodb

# Setup database tables  
npm run setup-dynamodb

# Start development server
npm run dev
```

## Production Notes

For production deployment:
- Replace DynamoDB Local with AWS DynamoDB
- Update AWS credentials and region configuration
- Configure proper CORS origins
- Add authentication/rate limiting as needed
- Set up monitoring and alerting

## Viewing Impression Data

### Option 1: DynamoDB Admin UI (Recommended)

Start the web-based admin interface:
```bash
npm run admin-ui
```

Then open http://localhost:8001 in your browser to:
- Browse tables and data
- Run queries and scans
- View table schemas
- Export data

### Option 2: Command Line Viewer

View impressions directly in the terminal:
```bash
# View all recent impressions
npm run view-impressions

# View impressions for a specific ad
node scripts/view-impressions.js ad test_ad_123

# View impressions for a specific publisher
node scripts/view-impressions.js publisher test_pub_456

# View more impressions (default is 20)
node scripts/view-impressions.js all 50
```

### Option 3: AWS CLI (if installed)

```bash
# List all tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan table data
aws dynamodb scan --table-name AdImpressionEvents --endpoint-url http://localhost:8000
```
