const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const recipeData = require('./initialRecipeData');

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
        console.log('Connected to the SQLite database.');
        db.run(`DROP TABLE IF EXISTS pillSchedule`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS pillSchedule (
                schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                pill_id INTEGER NOT NULL,
                pill_slot INTEGER,
                dispense_time INTEGER NOT NULL,
                is_dispensed BOOLEAN DEFAULT 0,
                dispensed_at DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
        db.run(`DROP TABLE IF EXISTS pillDeviceTokens`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS pillDeviceTokens (
                device_id TEXT PRIMARY KEY,
                fcm_token TEXT NOT NULL,
                device_type INTEGER NOT NULL
            )`);
        });
        db.run(`DROP TABLE IF EXISTS pot`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS pot (
                recipe_id INTEGER PRIMARY KEY,
                current_step INTEGER
            )`);
        });
        db.run(`DROP TABLE IF EXISTS recipes`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY,
                name TEXT,
                estimated_time INTEGER
            )`);
        });
        db.run(`DROP TABLE IF EXISTS steps`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS steps (
                id INTEGER PRIMARY KEY,
                recipe_id INTEGER,
                step_order INTEGER,
                name TEXT,
                duration INTEGER,
                instructions TEXT,
                input TEXT,
                output TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )`);
        });
        db.run(`DROP TABLE IF EXISTS ingredients`, () => {
            db.run(`CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY,
                recipe_id INTEGER,
                serving_size INTEGER,
                name TEXT,
                quantity TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id)
            )`);
        });
        db.run(`CREATE TABLE IF NOT EXISTS motion (
            room_id INTEGER,
            event_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
  });
}

function insertRecipe(recipe) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO recipes (id, name, estimated_time) VALUES (?, ?, ?)`,
      [recipe.id, recipe.name, recipe.estimated_time],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function insertIngredient(recipeId, servingSize, ingredient) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ingredients (recipe_id, serving_size, name, quantity) VALUES (?, ?, ?, ?)`,
      [recipeId, servingSize, ingredient.name, ingredient.quantity],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function insertStep(step) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO steps (id, recipe_id, step_order, name, duration, instructions, input, output)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        step.id,
        step.recipe_id,
        step.step_order,
        step.name,
        step.duration,
        step.instructions,
        step.input,
        step.output,
      ],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function seed() {
  try {
    console.log('Creating tables...');
    await createTables();

    for (const recipe of recipeData) {
      await insertRecipe(recipe);

      for (const [servingSize, ingredients] of Object.entries(recipe.ingredientsByServing)) {
        for (const ingredient of ingredients) {
          await insertIngredient(recipe.id, parseInt(servingSize), ingredient);
        }
      }

      for (const step of recipe.steps || []) {
        await insertStep(step);
      }
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    db.close();
  }
}

seed();
