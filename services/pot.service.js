const db = require('../database/database');
const recipeData = require('../initialRecipeData');

// get recipes
exports.getRecipe = (req, res) => {
  const recipeResponses = recipeData      
  res.json(recipeResponses);
};

//Post current recipe
exports.postCurrentRecipe =  (req, res) => {

    const steps = recipeData[0].steps.map(step => step.instructions); //replace 0 with curr recipe id

    const {message} = req.body;

    const recipe_id = 1; //update selected recipe when we add more recipes
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
//