const db = require('../database/database');

// get recipe by id
exports.getRecipeById = (req, res) => {
    const recipeId = req.params.id;
  
    try {
      // Fetch recipe
      db.get(`SELECT * FROM recipes WHERE id = ?`, [recipeId], (err, recipe) => {
        if (err || !recipe) return res.status(404).json({ error: "Recipe not found" });
  
        // Fetch ingredients
        db.all(
          `SELECT serving_size, name, quantity FROM ingredients WHERE recipe_id = ?`,
          [recipeId],
          (err, ingredientsRows) => {
            if (err) return res.status(500).json({ error: err.message });
  
            // Group ingredients by serving size
            const ingredientsByServing = {};
            for (const row of ingredientsRows) {
              if (!ingredientsByServing[row.serving_size]) {
                ingredientsByServing[row.serving_size] = [];
              }
              ingredientsByServing[row.serving_size].push({
                name: row.name,
                quantity: row.quantity,
              });
            }
  
            // Fetch steps
            db.all(
              `SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_order`,
              [recipeId],
              (err, stepsRows) => {
                if (err) return res.status(500).json({ error: err.message });
  
                // Extract distinct serving sizes
                const servings = [...new Set(ingredientsRows.map(row => row.serving_size))].sort();
  
                res.json({
                  id: recipe.id,
                  name: recipe.name,
                  estimated_time: recipe.estimated_time,
                  servings,
                  ingredientsByServing,
                  steps: stepsRows,
                });
              }
            );
          }
        );
      });
    } catch (e) {
      res.status(500).json({ error: 'Unexpected server error' });
    }
};


//Post current recipe
exports.postCurrentRecipe =  (req, res) => {
    const steps = ["Turn on the medium heat and put an empty pot on the stove", 
    "Heat the pot for 2 minutes then add in oil", 
    "Once the oil is hot (about 2 minutes after adding it to pot), carefully add in your main ingredient", 
    "Keep stirring the pot every 4 minutes until the food is cooked", 
    "Once the food is cooked, add in all your ingredients", 
    "The food is ready to be served. Once the consistency is to your liking, serve the food in a plate, and remember to turn off the stove."]
    
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
};

//Get current recipe
exports.getCurrentRecipe = (req, res) => {
    db.all(`SELECT * FROM pot`, (err, values) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(values[0]);
        }
    });
};

//Delete current recipe
exports.deleteCurrentRecipe = (req, res) => {
    db.run(`DELETE FROM pot`, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(200).json({result: "all entries deleted"});
        }
    });
};

//Put current recipe
exports.putCurrentRecipe = (req, res) => {
    const {recipe_id, step_order} = req.body;
    db.run('UPDATE pot SET current_step = ? WHERE recipe_id = ?', [step_order, recipe_id], function(err) {
        if (err) {
            res.status(400).json({error: err.message});
        } else {
            res.json({recipe_id: recipe_id, step_id: step_order})
        }
    })
};