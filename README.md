# COAD Demo Workspace

This workspace contains multiple applications for the COAD advertising platform demo.

## Structure

```
/
├── publishers/         # Static websites (ports 3000, 3001, 3002...)
│   └── portfolio/      # Portfolio website (port 3000) ✅
├── coad/              # Main platform
│   ├── platform/      # Publisher dashboard (port 4000) ✅
│   ├── api/           # Backend API server (port 8080) ✅
│   └── admin/         # Admin dashboard (port 4002) ✅
└── bot/               # adSdk for injection into publisher sites (port 4001) ✅
```

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
cd coad/platform
npm install
npm run dev  # Runs on http://localhost:4000

# Backend API
cd coad/api
npm install
npm start    # Runs on http://localhost:8080

# Admin Dashboard
cd coad/admin
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
cd bot
npm install
npm start    # Runs on http://localhost:4001
```

### SDK Integration
Publishers add this code to their website:
```html
<script>
  window.COADConfig = {
    publisherId: 'your-publisher-id',
    website: 'your-website.com',
    placements: ['.content', 'header', 'footer']
  };
</script>
<script src="http://localhost:4001/adsdk.js" async></script>
```

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
   # Terminal 1: Portfolio
   cd publishers/portfolio && npm run dev

   # Terminal 2: COAD Platform
   cd coad/platform && npm run dev

   # Terminal 3: API Server
   cd coad/api && npm start

   # Terminal 4: AdSDK Server
   cd bot && npm start

   # Terminal 5: Admin Dashboard
   cd coad/admin && npm run dev
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
- `GET /api/bot/config/:publisherId` - Get bot configuration for publisher

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
- ✅ COAD Platform Frontend (Port 4000)
- ✅ COAD API Backend (Port 8080)
- ✅ AdSDK Server (Port 4001)
- ✅ Admin Dashboard (Port 4002)
- ✅ SQLite Database with Full Schema
- ✅ Complete Integration Workflow
- ✅ Automated Health Checks
- ✅ Persistent Ad Placement Storage
- ✅ DOM-based Ad Placement
- ✅ Real-time Ad Serving
- ✅ Database-driven Publisher Management
- ✅ Admin Interface for Database Management

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
