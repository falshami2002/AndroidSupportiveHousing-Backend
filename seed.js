const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const recipeData = require('./initialRecipeData');

function runQuery(sql) {
    return new Promise((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
}

async function createTables() {
    try {
        await runQuery(`DROP TABLE IF EXISTS pillSchedule`);
        await runQuery(`CREATE TABLE IF NOT EXISTS pillSchedule (
            schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            pill_id INTEGER NOT NULL,
            pill_slot INTEGER,
            dispense_time INTEGER NOT NULL,
            is_dispensed BOOLEAN DEFAULT 0,
            dispensed_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('Recipes table created.');
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
    db.close();
  }
}

seed();
