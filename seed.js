require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render
});

async function runQuery(sql) {
  try {
    await pool.query(sql);
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
}

async function createTables() {
  try {
    await runQuery(`DROP TABLE IF EXISTS pillSchedule`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pillSchedule (
      schedule_id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      pill_id INTEGER NOT NULL,
      pill_slot INTEGER,
      dispense_time INTEGER NOT NULL,
      is_dispensed BOOLEAN DEFAULT FALSE,
      dispensed_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await runQuery(`DROP TABLE IF EXISTS pillDeviceTokens`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pillDeviceTokens (
      device_id TEXT PRIMARY KEY,
      fcm_token TEXT NOT NULL,
      device_type INTEGER NOT NULL
    )`);

    await runQuery(`DROP TABLE IF EXISTS pot`);
    await runQuery(`CREATE TABLE IF NOT EXISTS pot (
      recipe_id INTEGER PRIMARY KEY,
      current_step INTEGER
    )`);

    await runQuery(`DROP TABLE IF EXISTS motion`);
    await runQuery(`CREATE TABLE IF NOT EXISTS motion (
      room_id INTEGER,
      event_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Tables created.');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

async function seed() {
  try {
    console.log('Creating tables...');
    await createTables();
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await pool.end(); // close connection
  }
}

seed();