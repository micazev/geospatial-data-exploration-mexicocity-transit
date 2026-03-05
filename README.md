# Mexico City Transit System Dashboard

An interactive geospatial analysis platform for Mexico City's comprehensive public transportation system. This project transforms raw GTFS data into actionable insights for city planners and transit officials.

## Overview

This is a full-stack web application that visualizes Mexico City's 9 transportation modalities (Metro, Metrobus, Trolebus, Light Rail, Cable Car, PUMA Bus, RTP, Corredores Concesionados, and Suburbano) with interactive filtering and real-time data exploration.

### Key Features

- **9 Transportation Modes**: Complete coverage of Metro, Metrobus, Trolebus, Light Rail, Cable Car, PUMA Bus, RTP, Corredores, and Suburbano
- **Interactive Filtering**: Filter by transportation mode, time of day (0-23 hours), and geographic district
- **Route Visualization**: See detailed route paths, stops, and schedules
- **Heatmap Analysis**: Visualize density of routes and stops across the city
- **District-Level Data**: Explore transit coverage by Mexico City's 16 administrative districts
- **Real-time Updates**: Automatically fetches latest GTFS data daily
- **System Statistics**: Overview of routes, stops, and service coverage

## Architecture

```
┌─────────────────────────────────────┐
│     React Frontend (port 3000)      │  Interactive dashboard
├─────────────────────────────────────┤
│    Node.js/Express API (port 5000)  │  RESTful API endpoints
├─────────────────────────────────────┤
│  Python ETL Processor (scheduled)   │  GTFS data pipeline
├─────────────────────────────────────┤
│   PostgreSQL + PostGIS (port 5432)  │  Geospatial database
└─────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 19 + TypeScript + Leaflet (mapping) + Zustand (state management)
- **Backend**: Node.js + Express (REST API)
- **Data Pipeline**: Python + pandas + shapely (GTFS processing)
- **Database**: PostgreSQL + PostGIS (spatial queries)
- **Build Tools**: Vite (frontend), Docker (containerization)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL 12+ with PostGIS extension
- Docker & Docker Compose (optional, for containerized setup)

### Option 1: Docker Compose (Recommended)

The easiest way to get everything running:

```bash
# Clone the repository
git clone <repository-url>
cd geospatial-data-exploration-mexicocity-transit

# Start all services (database, backend API, frontend)
docker-compose up -d

# The dashboard will be available at http://localhost:3000
# API will be available at http://localhost:5000
```

The Docker setup includes:
- PostgreSQL database with PostGIS
- Node.js backend API
- Redis caching (optional)
- Automatic database initialization

### Option 2: Local Development

#### 1. Setup Backend

```bash
cd backend

# Copy environment file and configure
cp .env.example .env

# Install dependencies
npm install

# Install Python ETL dependencies
pip install -r etl/requirements.txt

# Initialize database
npm run init-db

# Load GTFS data
python etl/gtfs_processor.py

# Start backend server
npm run dev    # development with auto-reload
npm start      # production
```

#### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

All endpoints are under `/api/v1`:

### Maps
- `GET /maps/overview` - Get base map config and districts

### Routes
- `GET /routes?mode=METRO&district=Cuauhtémoc` - List all routes with optional filters
- `GET /routes/:id` - Get route details, stops, and geometry

### Stops
- `GET /stops?mode=MB&limit=1000` - List stops with optional filters
- `GET /stops/:id` - Get stop details and connected routes

### Statistics
- `GET /statistics?mode=METRO&district=Benito%20Juárez` - Get system-wide statistics

### Heatmaps
- `GET /heatmap/routes?mode=METRO` - Get route density heatmap
- `GET /heatmap/stops?district=Coyoacán` - Get stop distribution heatmap

### Temporal
- `GET /temporal/METRO/8` - Get routes/stops active at 8:00 AM

## Data Pipeline

The GTFS ETL pipeline automatically:

1. Fetches latest GTFS data from [datos.cdmx.gob.mx](https://datos.cdmx.gob.mx/dataset/gtfs)
2. Parses routes, trips, stops, stop_times, and shapes files
3. Detects transportation modes from route type and naming patterns
4. Loads data into PostgreSQL with PostGIS geometries
5. Creates spatial indexes for fast queries
6. Logs update status and timestamps

### Manual GTFS Update

```bash
# From backend directory
python etl/gtfs_processor.py

# Or in scheduled mode (runs daily)
python etl/gtfs_processor.py --schedule
```

## Database Schema

### Tables

- **routes** - Route definitions with IDs, modes, colors, agency
- **trips** - Trip details linked to routes and shapes
- **stops** - Stop locations (POINT geometry) with accessibility info
- **stop_times** - Arrival/departure times at each stop
- **shapes** - Route geometries (route paths) as sequences of points
- **districts** - Mexico City's 16 delegations (POLYGON geometry)
- **update_log** - Tracks when GTFS data was updated

All spatial columns use PostGIS geometry types for efficient geographic queries.

## Frontend Components

### Main Dashboard
- **MapContainer**: Interactive Leaflet map with routes, stops, and heatmaps
- **FilterPanel**: Mode, time, and district filtering controls
- **Statistics**: Summary stats panel showing totals and breakdowns

### Filters
- **ModeFilter**: Select one or more transportation modes
- **TimeFilter**: Hour-of-day slider (0-23)
- **DistrictSearch**: Search and select Mexico City districts

### Popups
- **RouteDetails**: Shows route info, connected stops, and schedules
- **StopDetails**: Shows stop info and connecting routes

## Configuration

### Backend Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mexico_city_transit
DB_USER=postgres
DB_PASSWORD=postgres

# GTFS Source
GTFS_URL=https://datos.cdmx.gob.mx/dataset/gtfs

# ETL Schedule (cron format)
ETL_SCHEDULE=0 0 * * *

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration

Edit `frontend/vite.config.js` to change:
- Development server port
- API proxy settings
- Build output directory

## Project Structure

```
.
├── backend/
│   ├── server.js              # Express server entry point
│   ├── config/                # Database and environment config
│   ├── controllers/           # Route handlers
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic
│   ├── etl/                   # GTFS data pipeline
│   │   ├── gtfs_processor.py # Main ETL script
│   │   └── requirements.txt   # Python dependencies
│   ├── scripts/               # Utility scripts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MapContainer.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── Statistics.jsx
│   │   │   ├── RouteDetails.jsx
│   │   │   ├── StopDetails.jsx
│   │   │   └── filters/       # Filter sub-components
│   │   ├── services/          # API client
│   │   ├── context/           # State management (Zustand)
│   │   ├── styles/            # CSS styling
│   │   └── main.jsx           # React entry point
│   ├── public/
│   │   └── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml         # Multi-container setup
├── Dockerfile                 # Backend container
└── README.md
```

## Development Workflow

### Adding a New API Endpoint

1. Create a controller in `backend/controllers/`
2. Add route handler in `backend/routes/api.js`
3. Create API client method in `frontend/src/services/api.js`
4. Use in React components with Zustand store

### Adding a New Filter

1. Create filter component in `frontend/src/components/filters/`
2. Add state management to `frontend/src/context/mapStore.js`
3. Update MapContainer to use new filter
4. Update backend API endpoint to support new parameter

### Database Migrations

After modifying the schema, update `backend/config/init_db.sql` and run:

```bash
npm run init-db
```

## Performance Optimization

### Backend
- PostGIS spatial indexes for fast geographic queries
- Connection pooling for database efficiency
- CORS configuration to prevent unnecessary requests

### Frontend
- Lazy loading of map components
- Debounced filter updates
- GeoJSON feature caching
- React component memoization for large lists

## Testing

### Manual Testing Checklist

1. **Filter Interactions**
   - [ ] Toggle transportation modes
   - [ ] Adjust time slider
   - [ ] Search and select districts
   - [ ] Reset filters

2. **Map Display**
   - [ ] Routes render with correct colors
   - [ ] Stops display as markers
   - [ ] Heatmap updates with filters
   - [ ] Map is responsive on mobile

3. **Data Verification**
   - [ ] Route counts match Jupyter analysis
   - [ ] Stop locations are accurate
   - [ ] Statistics update correctly
   - [ ] No console errors

4. **API**
   - [ ] All endpoints respond correctly
   - [ ] Filtering works as expected
   - [ ] Response times < 500ms
   - [ ] Large datasets handled efficiently

## Deployment

### To Heroku

```bash
git push heroku main

# Set environment variables
heroku config:set DB_HOST=<your-db-host>
```

### To AWS / DigitalOcean

Deploy using Docker images:

```bash
# Build images
docker build -t mexico-city-transit:backend ./backend

# Push to registry
docker tag mexico-city-transit:backend <registry>/mexico-city-transit:backend
docker push <registry>/mexico-city-transit:backend

# Deploy with docker-compose from cloud server
docker pull <registry>/mexico-city-transit:backend
docker-compose up -d
```

## Troubleshooting

### Backend Won't Connect to Database
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Check DB credentials in `.env`
- Ensure PostGIS extension exists: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Frontend Can't Connect to API
- Check backend is running: `curl http://localhost:5000/health`
- Verify CORS_ORIGIN matches your frontend URL
- Check browser console for detailed errors

### GTFS Data Not Loading
- Verify GTFS_URL is accessible
- Check disk space for large ZIP files
- Review Python error logs
- Ensure database tables exist: `npm run init-db`

### Map Not Rendering
- Ensure Leaflet CSS is loaded (check in browser DevTools)
- Verify map data received from API
- Check browser console for JavaScript errors

## Original Analysis

This project builds on the original Jupyter notebook analysis (`analiseDeDados_mexicoCityGTFS.ipynb`) which performed:

- Shapefile visualization of Mexico City districts
- Interactive Folium map creation with multiple tile layers
- Transportation mode separation (9 modalities)
- Per-modal route and stop analysis
- Heat map visualization of density patterns
- Temporal analysis with 24-hour scheduling

The current dashboard version modernizes this analysis with a professional UI, real-time data updates, and interactive filtering capabilities.

## Data Source

All data originates from:
- **GTFS Feeds**: [Mexico City Open Data Portal](https://datos.cdmx.gob.mx/dataset/gtfs)
- **Shapefiles**: [CONABIO](http://www.conabio.gob.mx/informacion/gis/)

GTFS data is licensed under [CDMX Open Data License](https://datos.cdmx.gob.mx/)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

## License

This project maintains the same license as the original data sources.

## Contact & Support

For issues, feature requests, or questions, please open an issue on GitHub or contact the development team.

---

**Last Updated:** February 2026
**Maintainer:** Geospatial Analysis Team
