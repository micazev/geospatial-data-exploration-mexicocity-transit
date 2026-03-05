const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const initializeDatabase = async () => {
  try {
    console.log('Connecting to database...');

    // Read SQL initialization file
    const sqlFilePath = path.join(__dirname, 'config', 'init_db.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Creating database schema...');

    // Execute SQL file
    await pool.query(sqlContent);

    console.log('✓ Database schema initialized successfully');

    // Verify tables exist
    const tablesResult = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );

    console.log('Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    process.exit(1);
  }
};

initializeDatabase();
