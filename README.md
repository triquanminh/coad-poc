# COAD Demo Workspace

This workspace contains multiple applications for the COAD advertising platform demo with complete ad impression tracking.

## System Architecture

```
/
├── publishers/         # Static websites (ports 3000, 3001, 3002...)
│   └── portfolio/      # Portfolio website (port 3000) ✅
├── platform/          # Publisher dashboard (port 4000) ✅
├── ad-serving-engine/  # Backend API server (port 8080) ✅
├── admin/             # Admin dashboard (port 4002) ✅
├── tag/               # AdSDK for injection into publisher sites (port 4001) ✅
└── tracking/          # Impression tracking server (port 3002) ✅
    ├── DynamoDB Local (port 8000)
    └── Admin UI (port 8001)
```

## COAD Tracking System

The COAD tracking system provides comprehensive ad impression tracking with:

1. **COAD Tracking Server** (`tracking/`) - Node.js server that handles impression tracking
2. **COAD Ad Serving Engine** (`ad-serving-engine/`) - Updated to include tracking pixel URLs in ad configurations
3. **COAD Tag** (`tag/`) - Updated to embed tracking pixels in ad iframes
4. **DynamoDB Local** - Local database for storing impression data

### Tracking Data Flow

```
Publisher Website
    ↓ (loads ad)
COAD Tag → Ad Serving Engine → Returns ad config with trackingPixel URL
    ↓ (renders ad with pixel)
Ad Iframe → Tracking Server → Logs to DynamoDB
```

## Quick Start - Tracking System

### 1. Install COAD Tracking Server

```bash
# Navigate to tracking server directory
cd tracking

# Install dependencies
npm install

# Install DynamoDB Local
npm run install-dynamodb
```

### 2. Setup Database Tables

```bash
cd tracking

# Create the AdImpressionEvents table
npm run setup-dynamodb
```

### 3. Start All Tracking Services

**One Command Setup (Recommended):**
```bash
cd tracking
npm run dev
```

This starts:
- 🔵 **DynamoDB Local** (port 8000)
- 🟢 **Admin UI** (port 8001)
- 🟡 **Tracking Server** (port 3002)

**Individual Services:**
```bash
# Start individual services
npm run dev-tracking      # Tracking server only
npm run dev-dynamodb       # DynamoDB Local only
npm run dev-dynamodb-ui    # Admin UI only
```

### 4. Start Ad Serving Engine

```bash
cd ad-serving-engine
npm start    # Runs on port 8080
```

### 5. Test the System

```bash
cd tracking

# Run automated tests
npm test

# Or test impression tracking manually
npm run test-impression

# View impression data
npm run view-impressions
```

### 6. Access UIs

- **DynamoDB Admin UI**: http://localhost:8001
- **Tracking Server**: http://localhost:3002
- **Ad Serving Engine**: http://localhost:8080

## Portfolio Website (Port 3000)

A modern, responsive portfolio website built with React and Vite.

### Features
- Modern responsive design
- Hero section with call-to-action
- About section with stats
- Skills showcase
- Projects portfolio
- Contact form
- Bot injection ready (adSdk container)

### Running the Portfolio
```bash
cd publishers/portfolio
npm install
npm run dev
```

The portfolio will be available at http://localhost:3000

### Bot Integration
The portfolio includes a dedicated container (`#ad-sdk-container`) for bot injection, positioned at the bottom-right of the page.

## COAD Platform (Port 4000) ✅

A comprehensive publisher management interface built with React and Express API.

### Features
- **Publisher Registration**: Register websites with automated health checks
- **Database Storage**: SQLite database to track websites and ad placements
- **DOM Analysis**: Intelligent ad placement suggestions based on website structure
- **Ad Placement Management**: Visual interface for choosing and managing ad locations via DOM selectors
- **Persistent Storage**: All website registrations and ad placements are saved to database
- **SDK Integration**: Automated generation of integration code
- **Real-time Health Monitoring**: Website performance and compatibility checks
- **Health Check History**: Track website health over time

### Running the COAD Platform
```bash
# Frontend (React)
cd platform
npm install
npm run dev  # Runs on http://localhost:4000

# Backend API
cd ad-serving-engine
npm install
npm start    # Runs on http://localhost:8080

# Admin Dashboard
cd admin
npm install
npm run dev  # Runs on http://localhost:4002
```

### Available Routes
- **Home**: http://localhost:4000/
- **Publisher Portal**: http://localhost:4000/publisher
- **Advertiser Portal**: http://localhost:4000/advertiser (coming soon)
- **Admin Dashboard**: http://localhost:4002/

## Admin Dashboard (Port 4002) ✅

Comprehensive admin interface for managing the COAD platform database.

### Features
- **Dashboard Overview**: Real-time statistics and system health
- **Website Management**: View, monitor, and delete registered websites
- **Publisher Management**: Manage publishers and their configurations
- **Database Monitoring**: Track ad placements, health checks, and system metrics
- **Bulk Operations**: Delete websites and publishers with all associated data

### Admin Interface
- Modern React-based UI with responsive design
- Real-time data fetching from API endpoints
- Confirmation dialogs for destructive operations
- Detailed information cards for each entity
- Health status monitoring and response time tracking

## AdSDK Bot (Port 4001) ✅

Advanced JavaScript SDK for automatic ad injection and management.

### Features
- **Automatic Ad Placement**: Injects ads based on DOM selectors
- **Real-time Ad Loading**: Fetches ads from COAD API
- **Performance Optimized**: Asynchronous, non-blocking loading
- **Event Tracking**: Impression and click tracking
- **Auto-refresh**: Configurable ad refresh intervals
- **Responsive Design**: Mobile-friendly ad containers

### Running the AdSDK
```bash
cd tag
npm install
npm start    # Runs on http://localhost:4001
```

### SDK Integration (Zero-Configuration!)
Publishers now only need **one line** of code:
```html
<script src="http://localhost:4001/adsdk.js" async></script>
```

**That's it!** The SDK automatically:
- 🔍 **Detects the current domain**
- 🔍 **Looks up publisher configuration** from our API
- 🔍 **Loads the appropriate ad placements**
- 🔍 **Starts serving ads immediately**

### How Auto-Detection Works
1. **Domain Detection**: SDK reads `window.location.hostname`
2. **API Lookup**: Calls `/api/bot/config-by-domain?domain=example.com`
3. **Configuration Loading**: Retrieves publisher ID, placements, and settings
4. **Ad Serving**: Automatically creates containers and loads ads

### Benefits
- ✅ **No Publisher ID needed** - Completely automatic
- ✅ **No manual configuration** - Zero maintenance
- ✅ **Works immediately** - Just add the script tag
- ✅ **Dynamic updates** - New placements work without code changes

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COAD Demo System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Portfolio (3000)     COAD Platform (4000)    AdSDK (4001) │
│  ┌─────────────┐     ┌─────────────────┐     ┌───────────┐  │
│  │   React     │────▶│  Publisher      │────▶│    Bot    │  │
│  │  Website    │     │  Management     │     │   Server  │  │
│  │             │     │                 │     │           │  │
│  │ + AdSDK     │◀────│  Health Check   │     │  adsdk.js │  │
│  │   Injection │     │  DOM Analysis   │     │           │  │
│  └─────────────┘     │  SDK Generator  │     └───────────┘  │
│                      └─────────────────┘                    │
│                               │                             │
│                      ┌─────────────────┐                    │
│                      │   API Server    │                    │
│                      │   (Port 8080)   │                    │
│                      │                 │                    │
│                      │ • Health Checks │                    │
│                      │ • Ad Serving    │                    │
│                      │ • Config Mgmt   │                    │
│                      └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Integration Workflow

1. **Website Health Check** (http://localhost:4000/publisher)
   - Enter website URL (e.g., http://localhost:3000)
   - System performs automated health check
   - Analyzes DOM structure and suggests ad placements
   - No automatic registration

2. **Website Registration**
   - After successful health check, click "Register Website"
   - System checks for duplicate URLs
   - Creates unique Publisher ID if URL is new
   - Stores website data in database
   - **Automatically navigates to Ad Placements step**

3. **Ad Placement Selection**
   - Choose from suggested DOM selectors
   - Add custom selectors if needed
   - All placements saved to database
   - Real-time updates with loading indicators

4. **SDK Integration**
   - **Displays real data from API**: Publisher ID, website URL, placement count
   - **Live configuration**: Fetches current publisher configuration
   - Copy generated integration code with actual placements
   - Add to website's HTML head section
   - Deploy website

5. **Automatic Ad Display**
   - AdSDK loads from http://localhost:4001/adsdk.js
   - Finds specified DOM elements
   - Injects ads automatically
   - Tracks impressions and clicks

## Testing the Complete System

1. **Start all services**:
   ```bash
   # Terminal 1: Tracking System (DynamoDB + Admin UI + Tracking Server)
   cd tracking && npm run dev

   # Terminal 2: Portfolio
   cd publishers/portfolio && npm run dev

   # Terminal 3: COAD Platform
   cd platform && npm run dev

   # Terminal 4: Ad Serving Engine
   cd ad-serving-engine && npm start

   # Terminal 5: AdSDK Server
   cd tag && npm start

   # Terminal 6: Admin Dashboard
   cd admin && npm run dev
   ```

2. **Register Portfolio Website**:
   - Go to http://localhost:4000/publisher
   - Enter "http://localhost:3000" as website URL
   - Complete the registration process

3. **Integrate AdSDK**:
   - Copy the generated SDK code
   - Add to portfolio website
   - See ads appear automatically

## Database Schema

The system uses SQLite with the following tables:

### `websites`
- `id` - Unique website identifier
- `url` - Website URL
- `publisher_id` - Unique publisher identifier
- `title` - Website title
- `description` - Website description
- `status` - Website status (active/inactive)
- `health_status` - Current health status
- `response_time` - Latest response time
- `dom_elements` - Number of DOM elements
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### `ad_placements`
- `id` - Unique placement identifier
- `website_id` - Reference to website
- `selector` - DOM selector for ad placement
- `description` - Placement description
- `priority` - Placement priority (high/medium/low)
- `is_active` - Whether placement is active
- `created_at` - Creation timestamp

### `health_checks`
- `id` - Unique check identifier
- `website_id` - Reference to website
- `status` - Health check result
- `response_time` - Response time
- `dom_elements` - DOM element count
- `error_message` - Error details (if any)
- `checked_at` - Check timestamp

### `ad_impression_events` (DynamoDB)
- `impressionId` (String) - Unique impression identifier (Primary Key)
- `timestamp` (String) - ISO timestamp (Sort Key)
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

## Viewing Impression Data

### Option 1: DynamoDB Admin UI (Recommended)

Start the web-based admin interface:
```bash
cd tracking
npm run dev-dynamodb-ui
```

Then open http://localhost:8001 in your browser to:
- Browse tables and data
- Run queries and scans
- View table schemas
- Export data

### Option 2: Command Line Viewer

View impressions directly in the terminal:
```bash
cd tracking

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

## API Endpoints

### Publisher Management (Unified API)
- `POST /api/health-check` - Perform website health check (no registration)
- `POST /api/publisher/register` - Register publisher with website
- `GET /api/publishers` - Get all publishers with website data
- `GET /api/publisher/:publisherId` - Get specific publisher configuration
- `DELETE /api/publisher/:publisherId` - Delete publisher (cascades to website and all data)

### Ad Placement Management
- `POST /api/publisher/:publisherId/placements` - Add ad placement for publisher
- `GET /api/publisher/:publisherId/placements` - Get publisher's ad placements
- `DELETE /api/placement/:id` - Remove ad placement

### Bot Configuration
- `GET /api/bot/config-by-domain` - Auto-detect publisher config by domain (NEW!)
- `GET /api/bot/config/:publisherId` - Get bot configuration for publisher (legacy)

### Tracking Server (Port 3002)
- `GET /health` - Health check
- `GET /track/impression` - Track impression (returns 1x1 pixel)
- `GET /stats` - Get tracking statistics

### System Status
- `GET /health` - API health check
- `GET /api/database/status` - Database status and statistics

### Admin API
- `GET /api/admin/publishers` - Get all publishers with detailed information
- `DELETE /api/admin/publishers/:publisherId` - Admin delete publisher
- `GET /api/admin/stats` - Get dashboard statistics

## Delete Operations

The system supports comprehensive data deletion with cascade operations:

### Delete by Publisher ID
```bash
curl -X DELETE http://localhost:8080/api/publisher/{publisherId}
```
- Removes the publisher and their website
- Automatically deletes all associated ad placements
- Removes all health check history
- Returns confirmation with deleted publisher details

### Admin Delete
```bash
curl -X DELETE http://localhost:8080/api/admin/publishers/{publisherId}
```
- Same as above but with admin-level logging and confirmation

**Note**: All delete operations use CASCADE deletion to ensure no orphaned records remain in the database.

## Current Status
- ✅ Portfolio Website (Port 3000)
- ✅ MyNewOne Publisher Website (Port 3001)
- ✅ COAD Platform Frontend (Port 4000)
- ✅ COAD Ad Serving Engine (Port 8080)
- ✅ AdSDK Server (Port 4001)
- ✅ Admin Dashboard (Port 4002)
- ✅ **COAD Tracking Server (Port 3002)** - NEW!
- ✅ **DynamoDB Local (Port 8000)** - NEW!
- ✅ **DynamoDB Admin UI (Port 8001)** - NEW!
- ✅ SQLite Database with Full Schema
- ✅ **DynamoDB Impression Tracking** - NEW!
- ✅ Complete Integration Workflow
- ✅ Automated Health Checks
- ✅ Persistent Ad Placement Storage
- ✅ DOM-based Ad Placement
- ✅ Real-time Ad Serving
- ✅ **Pixel-based Impression Tracking** - NEW!
- ✅ Database-driven Publisher Management
- ✅ Admin Interface for Database Management
- ✅ Zero-Configuration AdSDK with Auto-Detection
- ✅ **Comprehensive Data Viewing Tools** - NEW!

## Admin Dashboard Usage

The admin dashboard provides comprehensive management capabilities:

### Dashboard Overview (http://localhost:4002/dashboard)
- Real-time statistics: total publishers, ad placements
- Health status monitoring: healthy vs unhealthy publishers
- Performance metrics: average response times
- Recent activity: newly registered publishers

### Publisher Management (http://localhost:4002/publishers)
- Unified view of all registered publishers and their websites
- Monitor health status and response times for each publisher's website
- View associated ad placements for each publisher
- Delete publishers (removes website and all associated data)
- Track publisher activity and performance
- View detailed website metadata (URL, title, description)

### Key Features
- **Real-time Data**: All data is fetched live from the API
- **Confirmation Dialogs**: Destructive operations require confirmation
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with retry options
- **Auto-refresh**: Manual refresh buttons to update data
