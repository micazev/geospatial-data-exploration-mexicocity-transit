-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(255) PRIMARY KEY,
    agency_id VARCHAR(255),
    route_short_name VARCHAR(255),
    route_long_name VARCHAR(255),
    route_desc TEXT,
    route_type INTEGER,
    route_url VARCHAR(255),
    route_color VARCHAR(6),
    route_text_color VARCHAR(6),
    mode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    trip_id VARCHAR(255) PRIMARY KEY,
    route_id VARCHAR(255) REFERENCES routes(route_id),
    service_id VARCHAR(255),
    trip_headsign VARCHAR(255),
    direction_id INTEGER,
    block_id VARCHAR(255),
    shape_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
    stop_id VARCHAR(255) PRIMARY KEY,
    stop_code VARCHAR(255),
    stop_name VARCHAR(255),
    stop_desc TEXT,
    stop_lat DECIMAL(10, 8),
    stop_lon DECIMAL(10, 8),
    zone_id VARCHAR(255),
    stop_url VARCHAR(255),
    location_type INTEGER,
    parent_station VARCHAR(255),
    stop_timezone VARCHAR(255),
    wheelchair_boarding INTEGER,
    district VARCHAR(255),
    geometry GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stop times table
CREATE TABLE IF NOT EXISTS stop_times (
    trip_id VARCHAR(255) REFERENCES trips(trip_id),
    arrival_time TIME,
    departure_time TIME,
    stop_id VARCHAR(255) REFERENCES stops(stop_id),
    stop_sequence INTEGER,
    stop_headsign VARCHAR(255),
    pickup_type INTEGER,
    drop_off_type INTEGER,
    primary key (trip_id, stop_sequence)
);

-- Shapes table
CREATE TABLE IF NOT EXISTS shapes (
    route_id VARCHAR(255),
    shape_pt_lat DECIMAL(10, 8),
    shape_pt_lon DECIMAL(10, 8),
    shape_pt_sequence INTEGER,
    shape_dist_traveled DECIMAL(10, 2),
    geometry GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    primary key (route_id, shape_pt_sequence)
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geometry GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update log table
CREATE TABLE IF NOT EXISTS update_log (
    id SERIAL PRIMARY KEY,
    data_source VARCHAR(255),
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_count INTEGER,
    status VARCHAR(50),
    details TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routes_mode ON routes(mode);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_trip_id ON stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop_id ON stop_times(stop_id);
CREATE INDEX IF NOT EXISTS idx_stops_district ON stops(district);
CREATE INDEX IF NOT EXISTS idx_stops_geometry ON stops USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_shapes_route_id ON shapes(route_id);
CREATE INDEX IF NOT EXISTS idx_districts_geometry ON districts USING GIST(geometry);
