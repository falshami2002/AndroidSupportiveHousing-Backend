const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs')

const app = express();
const PORT = 3000;

fs.unlink("./database.db", (err) => {
    if (err) {
      console.error('Could not delete the database:', err.message);
    } else {
      console.log('Database deleted successfully.');
    }
  });

// Middleware
app.use(bodyParser.json());

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
            pill_id INTEGER,
            dispense_time TIME 
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS pot (
            recipe_id INTEGER PRIMARY KEY,
            current_step INTEGER
        )`);
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

//Delete all recipes
app.delete('/recipe', (req, res) => {
    db.run(`DELETE FROM recipes`, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(200).json({result: "all entries deleted"});
        }
    });
});

//post step
app.post('/step', (req, res) => {
    const {recipe_id, step_order, name, duration, instructions, input, output} = req.body;
    db.all(`INSERT INTO steps (recipe_id, step_order, name, duration, instructions, input, output) VALUES (?, ?, ?, ?, ?, ?, ?)`, [recipe_id, step_order, name, duration, instructions, input, output], (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({
                recipe_id: recipe_id,
                step_order: step_order,
                name: name,
                duration: duration,
                instructions: instructions,
                input: input,
                output: output
            });
        }
    });
});

//Get steps
app.get('/step', (req, res) => {
    const {recipe_id, step_order} = req.query;
    db.all(`SELECT * FROM steps WHERE recipe_id = ? AND step_order = ?`, [recipe_id, step_order], (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json(values);
        }
    });
});

//Get recipe
app.get('/recipe', (req, res) => {
    const {id} = req.query;
    db.all(`SELECT * FROM recipes WHERE id = ?`, [id], (err, recipeResults) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        } else if (!recipeResults || recipeResults.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const recipe = recipeResults[0];

        db.all(`SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_order ASC`, [id], (err, stepResults) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            return res.status(200).json({
                id: recipe.id,
                name: recipe.name,
                estimated_time: recipe.estimated_time,
                ingredients: JSON.parse(recipe.ingredients),
                steps: stepResults
            });
        });
    });
});

//post recipe
app.post('/recipe', (req, res) => {
    const {id, name, estimated_time, ingredients} = req.body;
    db.run(`INSERT INTO recipes (id, name, estimated_time, ingredients) VALUES (?, ?, ?, ?)`, [id, name, estimated_time, JSON.stringify(ingredients)], (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({
                id: id,
                name: name,
                estimated_time: estimated_time,
                ingredients: ingredients
            });
        }
    });
});

//Delete current recipe
app.delete('/current-recipe', (req, res) => {
    db.run(`DELETE FROM pot`, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(200).json({result: "all entries deleted"});
        }
    });
});

//Put current recipe
app.put('/current-recipe', (req, res) => {
    const {recipe_id, step_order} = req.body;
    db.run('UPDATE pot SET current_step = ? WHERE recipe_id = ?', [step_order, recipe_id], function(err) {
        if (err) {
            res.status(400).json({error: err.message});
        } else {
            res.json({recipe_id: recipe_id, step_id: step_order})
        }
    })
});

//Post current recipe
/*app.post('/current-recipe', (req, res) => {
    const {recipe_id, step_order} = req.body;
    db.run('INSERT INTO pot (recipe_id, current_step) VALUES (?, ?)', [recipe_id, step_order], function(err) {
        if (err) {
            res.status(400).json({error: err.message});
        } else {
            res.json({recipe_id: recipe_id, step_id: step_order})
        }
    })
});*/

app.post('/current-recipe', (req, res) => {
    const steps = ["Turn on the medium heat and put an empty pot on the stove", "Heat the pot for 2 minutes then add in oil", "Once the oil is hot (about 2 minutes after adding it to pot), carefully add in your main ingredient", "Keep stirring the pot every 4 minutes until the food is cooked", "Once the food is cooked, add in all your ingredients", "The food is ready to be served. Once the consistency is to your liking, serve the food in a plate, and remember to turn off the stove."]
    const {message} = req.body;

    const recipe_id = 1;
    const step_order = steps.indexOf(message) + 1;

    db.run(`DELETE FROM pot`, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.run(
            'INSERT INTO pot (recipe_id, current_step) VALUES (?, ?)',
            [recipe_id, step_order],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                } else {
                    res.json({ recipe_id: recipe_id, step_id: step_order });
                }
            }
        );
    });
});

//Get current recipe
app.get('/current-recipe', (req, res) => {
    db.all(`SELECT * FROM pot`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
});

//Post pill event
app.post('/pill-history', (req, res) => {
    const { pill_id, event_type } = req.body;
    db.run(`INSERT INTO pillHistory (pill_id, event_type) VALUES (?, ?)`, [pill_id, event_type], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            const now = new Date().toISOString()
            res.json({ pill_id: pill_id, event_type: event_type, created_at: now });
        }
    });
});

app.post('/pill-schedule', (req, res) => {
    const { pill_id, dispense_time } = req.body;
    db.run(`INSERT INTO pillSchedule (pill_id, dispense_time) VALUES (?, ?)`, [pill_id, dispense_time], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ pill_id: pill_id, dispense_time: dispense_time });
        }
    });
});

//Get all pill events
app.get('/pill-history', (req, res) => {
    db.all(`SELECT * FROM pillHistory`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
});

app.get('/pill-schedule', (req, res) => {
    db.all(`SELECT * FROM pillSchedule`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
});

app.delete('/pill-schedule', (req, res) => {
    const { pill_id, dispense_time } = req.body;
    db.run(`DELETE FROM pillSchedule WHERE pill_id = ? AND dispense_time = ?`, [pill_id, dispense_time], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.json({ pill_id: pill_id, dispense_time: dispense_time });
        }
    });
});

//Post motion event
app.post('/motion', (req, res) => {
    const { room_id, event_type } = req.body;
    db.run(`INSERT INTO motion (room_id, event_type) VALUES (?, ?)`, [room_id, event_type], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            const now = new Date().toISOString()
            res.json({ room_id: room_id, event_type: event_type, created_at: now });
        }
    });
});

//Get all motion events
app.get('/motion', (req, res) => {
    db.all(`SELECT * FROM motion`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values);
        }
    });
});

//Delete all for testing
app.delete('/pill-RESET', (req, res) => {
    db.run("DELETE FROM pill", (err) => { 
        if (err) {
            res.status(500).json({ error: err.message }); 
        } else {
            res.status(200).json({ message: 'Deleted successfully.' }); 
        }
    });
});

//Delete all for testing
app.delete('/motion-RESET', (req, res) => {
    db.run("DELETE FROM motion", (err) => { 
        if (err) {
            res.status(500).json({ error: err.message }); 
        } else {
            res.status(200).json({ message: 'Deleted successfully.' }); 
        }
    });
});

/*app.get('/users/:id', (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json(row);
        }
    });
});

// Update a user by ID
app.put('/users/:id', (req, res) => {
    const { name, email } = req.body;
    db.run(`UPDATE users SET name = ?, email = ? WHERE id = ?`, [name, email, req.params.id], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json({ id: req.params.id, name, email });
        }
    });
});

// Delete a user by ID
app.delete('/users/:id', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json({ message: 'User deleted' });
        }
    });
});*/

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
