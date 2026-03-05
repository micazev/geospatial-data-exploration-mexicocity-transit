#!/usr/bin/env python3
"""
GTFS Data ETL Pipeline for Mexico City Transit System
Fetches and processes GTFS data from datos.cdmx.gob.mx
"""

import os
import sys
import logging
import zipfile
import tempfile
import requests
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
from shapely.geometry import Point
import schedule
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GTFSETLPipeline:
    def __init__(self, db_host, db_port, db_name, db_user, db_password, gtfs_url):
        """Initialize database connection and configuration"""
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name
        self.db_user = db_user
        self.db_password = db_password
        self.gtfs_url = gtfs_url
        self.conn = None
        self.cursor = None

    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                host=self.db_host,
                port=self.db_port,
                database=self.db_name,
                user=self.db_user,
                password=self.db_password
            )
            self.cursor = self.conn.cursor()
            logger.info("✓ Connected to database")
        except Exception as e:
            logger.error(f"✗ Failed to connect to database: {e}")
            raise

    def close_db(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("✓ Database connection closed")

    def download_gtfs(self):
        """Download GTFS ZIP file from source"""
        try:
            logger.info(f"Downloading GTFS data from {self.gtfs_url}")
            response = requests.get(self.gtfs_url, timeout=60)
            response.raise_for_status()

            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            temp_file.write(response.content)
            temp_file.close()

            logger.info(f"✓ Downloaded GTFS file ({len(response.content) / 1024 / 1024:.2f} MB)")
            return temp_file.name
        except Exception as e:
            logger.error(f"✗ Failed to download GTFS data: {e}")
            raise

    def extract_gtfs(self, zip_path):
        """Extract GTFS ZIP file"""
        try:
            extract_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            logger.info(f"✓ Extracted GTFS files to {extract_dir}")
            return extract_dir
        except Exception as e:
            logger.error(f"✗ Failed to extract GTFS files: {e}")
            raise

    def detect_transportation_mode(self, route_type, route_name):
        """Detect transportation mode from route type and name"""
        mode_map = {
            3: 'MB',  # Bus
            0: 'METRO',  # Subway
            1: 'METRO',  # Subway
            2: 'TROLE',  # Tram/Streetcar
            5: 'TL',  # Cable Car / Aerial Lift
        }

        mode = mode_map.get(route_type, 'RTP')

        # Override based on route name patterns
        if route_name:
            name_upper = str(route_name).upper()
            if 'METRO' in name_upper:
                mode = 'METRO'
            elif 'METROBUS' in name_upper or 'MB' in name_upper:
                mode = 'MB'
            elif 'TROLE' in name_upper:
                mode = 'TROLE'
            elif 'TL' in name_upper or 'TREN LIGERO' in name_upper:
                mode = 'TL'
            elif 'CABLE' in name_upper or 'CBB' in name_upper:
                mode = 'CBB'
            elif 'PUMA' in name_upper:
                mode = 'PUMABUS'
            elif 'SUBURBANO' in name_upper or 'SUB' in name_upper:
                mode = 'SUB'
            elif 'CORREDOR' in name_upper or 'CC' in name_upper:
                mode = 'CC'

        return mode

    def load_routes(self, gtfs_dir):
        """Load routes from GTFS data"""
        try:
            routes_file = os.path.join(gtfs_dir, 'routes.txt')
            df = pd.read_csv(routes_file)

            logger.info(f"Processing {len(df)} routes...")

            # Clear existing routes
            self.cursor.execute('DELETE FROM routes')

            # Add mode column
            df['mode'] = df.apply(
                lambda row: self.detect_transportation_mode(row.get('route_type'), row.get('route_long_name')),
                axis=1
            )

            # Prepare data for insertion
            data = []
            for _, row in df.iterrows():
                data.append((
                    row.get('route_id'),
                    row.get('agency_id'),
                    row.get('route_short_name', ''),
                    row.get('route_long_name', ''),
                    row.get('route_desc', ''),
                    row.get('route_type'),
                    row.get('route_url', ''),
                    row.get('route_color', 'FFFFFF'),
                    row.get('route_text_color', '000000'),
                    row.get('mode')
                ))

            insert_query = """
                INSERT INTO routes
                (route_id, agency_id, route_short_name, route_long_name, route_desc,
                 route_type, route_url, route_color, route_text_color, mode)
                VALUES %s
            """

            execute_values(self.cursor, insert_query, data)
            self.conn.commit()

            logger.info(f"✓ Loaded {len(data)} routes")
            return len(data)
        except Exception as e:
            logger.error(f"✗ Failed to load routes: {e}")
            self.conn.rollback()
            raise

    def load_stops(self, gtfs_dir):
        """Load stops from GTFS data"""
        try:
            stops_file = os.path.join(gtfs_dir, 'stops.txt')
            df = pd.read_csv(stops_file)

            logger.info(f"Processing {len(df)} stops...")

            # Clear existing stops
            self.cursor.execute('DELETE FROM stops')

            # Prepare data for insertion
            data = []
            for _, row in df.iterrows():
                point = f"POINT({row.get('stop_lon')} {row.get('stop_lat')})"
                data.append((
                    row.get('stop_id'),
                    row.get('stop_code', ''),
                    row.get('stop_name'),
                    row.get('stop_desc', ''),
                    row.get('stop_lat'),
                    row.get('stop_lon'),
                    row.get('zone_id', ''),
                    row.get('stop_url', ''),
                    row.get('location_type', 0),
                    row.get('parent_station', ''),
                    row.get('stop_timezone', ''),
                    row.get('wheelchair_boarding', 0),
                    None,  # district - will be populated separately
                    point
                ))

            insert_query = """
                INSERT INTO stops
                (stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon,
                 zone_id, stop_url, location_type, parent_station, stop_timezone,
                 wheelchair_boarding, district, geometry)
                VALUES %s
            """

            execute_values(self.cursor, insert_query, data)
            self.conn.commit()

            logger.info(f"✓ Loaded {len(data)} stops")
            return len(data)
        except Exception as e:
            logger.error(f"✗ Failed to load stops: {e}")
            self.conn.rollback()
            raise

    def load_trips(self, gtfs_dir):
        """Load trips from GTFS data"""
        try:
            trips_file = os.path.join(gtfs_dir, 'trips.txt')
            df = pd.read_csv(trips_file)

            logger.info(f"Processing {len(df)} trips...")

            # Clear existing trips
            self.cursor.execute('DELETE FROM trips')

            # Prepare data for insertion
            data = []
            for _, row in df.iterrows():
                data.append((
                    row.get('trip_id'),
                    row.get('route_id'),
                    row.get('service_id'),
                    row.get('trip_headsign', ''),
                    row.get('direction_id'),
                    row.get('block_id', ''),
                    row.get('shape_id', '')
                ))

            insert_query = """
                INSERT INTO trips
                (trip_id, route_id, service_id, trip_headsign, direction_id, block_id, shape_id)
                VALUES %s
            """

            execute_values(self.cursor, insert_query, data)
            self.conn.commit()

            logger.info(f"✓ Loaded {len(data)} trips")
            return len(data)
        except Exception as e:
            logger.error(f"✗ Failed to load trips: {e}")
            self.conn.rollback()
            raise

    def load_stop_times(self, gtfs_dir):
        """Load stop times from GTFS data"""
        try:
            stop_times_file = os.path.join(gtfs_dir, 'stop_times.txt')
            df = pd.read_csv(stop_times_file)

            logger.info(f"Processing {len(df)} stop times...")

            # Clear existing stop times
            self.cursor.execute('DELETE FROM stop_times')

            # Prepare data for insertion
            data = []
            for _, row in df.iterrows():
                data.append((
                    row.get('trip_id'),
                    row.get('arrival_time'),
                    row.get('departure_time'),
                    row.get('stop_id'),
                    row.get('stop_sequence'),
                    row.get('stop_headsign', ''),
                    row.get('pickup_type', 0),
                    row.get('drop_off_type', 0)
                ))

            insert_query = """
                INSERT INTO stop_times
                (trip_id, arrival_time, departure_time, stop_id, stop_sequence,
                 stop_headsign, pickup_type, drop_off_type)
                VALUES %s
            """

            execute_values(self.cursor, insert_query, data)
            self.conn.commit()

            logger.info(f"✓ Loaded {len(data)} stop times")
            return len(data)
        except Exception as e:
            logger.error(f"✗ Failed to load stop times: {e}")
            self.conn.rollback()
            raise

    def load_shapes(self, gtfs_dir):
        """Load shapes from GTFS data"""
        try:
            shapes_file = os.path.join(gtfs_dir, 'shapes.txt')
            if not os.path.exists(shapes_file):
                logger.warning("shapes.txt not found, skipping shapes")
                return 0

            df = pd.read_csv(shapes_file)

            logger.info(f"Processing {len(df)} shape points...")

            # Clear existing shapes
            self.cursor.execute('DELETE FROM shapes')

            # Prepare data for insertion - group by route first
            data = []
            for _, row in df.iterrows():
                point = f"POINT({row.get('shape_pt_lon')} {row.get('shape_pt_lat')})"
                data.append((
                    row.get('shape_id'),
                    row.get('shape_pt_lat'),
                    row.get('shape_pt_lon'),
                    row.get('shape_pt_sequence'),
                    row.get('shape_dist_traveled', 0),
                    point
                ))

            insert_query = """
                INSERT INTO shapes
                (route_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled, geometry)
                VALUES %s
            """

            execute_values(self.cursor, insert_query, data)
            self.conn.commit()

            logger.info(f"✓ Loaded {len(data)} shape points")
            return len(data)
        except Exception as e:
            logger.error(f"✗ Failed to load shapes: {e}")
            self.conn.rollback()
            raise

    def log_update(self, total_records):
        """Log update to update_log table"""
        try:
            insert_query = """
                INSERT INTO update_log (data_source, record_count, status, details)
                VALUES (%s, %s, %s, %s)
            """
            self.cursor.execute(insert_query, (
                'GTFS - Mexico City',
                total_records,
                'SUCCESS',
                f'Updated at {datetime.now().isoformat()}'
            ))
            self.conn.commit()
            logger.info("✓ Logged update status")
        except Exception as e:
            logger.error(f"✗ Failed to log update: {e}")

    def run(self):
        """Execute full ETL pipeline"""
        zip_path = None
        extract_dir = None

        try:
            logger.info("=" * 50)
            logger.info("Starting GTFS ETL Pipeline")
            logger.info("=" * 50)

            self.connect_db()

            # Download and extract
            zip_path = self.download_gtfs()
            extract_dir = self.extract_gtfs(zip_path)

            # Load data
            total_records = 0
            total_records += self.load_routes(extract_dir)
            total_records += self.load_stops(extract_dir)
            total_records += self.load_trips(extract_dir)
            total_records += self.load_stop_times(extract_dir)
            total_records += self.load_shapes(extract_dir)

            # Log update
            self.log_update(total_records)

            logger.info("=" * 50)
            logger.info(f"✓ ETL Pipeline completed successfully ({total_records} records)")
            logger.info("=" * 50)

        except Exception as e:
            logger.error(f"✗ ETL Pipeline failed: {e}")
            raise
        finally:
            # Cleanup
            if zip_path and os.path.exists(zip_path):
                os.remove(zip_path)
            if extract_dir and os.path.exists(extract_dir):
                import shutil
                shutil.rmtree(extract_dir)

            self.close_db()

def main():
    """Main entry point"""
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = int(os.getenv('DB_PORT', 5432))
    db_name = os.getenv('DB_NAME', 'mexico_city_transit')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', 'postgres')
    gtfs_url = os.getenv('GTFS_URL', 'https://datos.cdmx.gob.mx/dataset/gtfs')

    pipeline = GTFSETLPipeline(db_host, db_port, db_name, db_user, db_password, gtfs_url)

    if len(sys.argv) > 1 and sys.argv[1] == '--schedule':
        logger.info("Running in scheduled mode")
        schedule_time = os.getenv('ETL_SCHEDULE', '0 0')  # Default: daily at midnight
        schedule.every().day.at(schedule_time).do(pipeline.run)

        logger.info(f"Scheduled to run at {schedule_time} daily")
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        pipeline.run()

if __name__ == '__main__':
    main()
