const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS pillHistory (
            pill_id INTEGER,
            event_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS pillSchedule (
            schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            pill_id INTEGER,
            dispense_time TIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`DROP TABLE IF EXISTS pot`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS pot (
                recipe_id INTEGER PRIMARY KEY,
                current_step INTEGER
            )`);
        });
        db.run(`CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY,
            name TEXT, 
            estimated_time INTEGER,
            ingredients TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            step_order INTEGER,
            name TEXT, 
            duration INTEGER, 
            instructions TEXT, 
            input TEXT, 
            output TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS motion (
            room_id INTEGER,
            event_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Utility function to promisify db.all
// function dbAll(query, params = []) {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (err, rows) => {
//       if (err) reject(err);
//       else resolve(rows);
//     });
//   });
// }

// async function printTablesAndColumns() {
//   try {
//     const tables = await dbAll(
//       `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
//     );

//     for (const table of tables) {
//       console.log(`\nTable: ${table.name}`);

//       const columns = await dbAll(`PRAGMA table_info(${table.name});`);
//       columns.forEach((col) => {
//         console.log(`  - ${col.name} (${col.type})`);
//       });
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }

// printTablesAndColumns();
// function dbAll(query, params = []) {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (err, rows) => {
//       if (err) reject(err);
//       else resolve(rows);
//     });
//   });
// }

// async function printTablesAndData() {
//   try {
//     const tables = await dbAll(
//       `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
//     );

//     for (const table of tables) {
//       const tableName = table.name;
//       console.log(`\n📄 Table: ${tableName}`);

//       const rows = await dbAll(`SELECT * FROM ${tableName};`);
//       if (rows.length === 0) {
//         console.log('  (no rows)');
//       } else {
//         rows.forEach((row, idx) => {
//           console.log(`  Row ${idx + 1}:`, row);
//         });
//       }
//     }
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//   }
// }

// printTablesAndData();
module.exports = db;