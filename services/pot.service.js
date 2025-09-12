const { Pool } = require('pg');
const recipeData = require('../initialRecipeData');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render
});

// get recipes
exports.getRecipe = (req, res) => {
  const recipeResponses = recipeData;
  res.json(recipeResponses);
};

// Post current recipe
exports.postCurrentRecipe = async (req, res) => {
  const steps = recipeData[0].steps.map(step => step.instructions); // replace 0 with curr recipe id
  const { message } = req.body;

  const recipe_id = 1; // update selected recipe when we add more recipes
  const step_order = steps.indexOf(message) + 1;

  try {
    await pool.query('DELETE FROM pot');

    await pool.query(
      'INSERT INTO pot (recipe_id, current_step) VALUES ($1, $2)',
      [recipe_id, step_order]
    );

    res.json({ recipe_id: recipe_id, step_id: step_order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current recipe
exports.getCurrentRecipe = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pot');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete current recipe
exports.deleteCurrentRecipe = async (req, res) => {
  try {
    await pool.query('DELETE FROM pot');
    res.status(200).json({ result: 'all entries deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Put current recipe
exports.putCurrentRecipe = async (req, res) => {
  const { recipe_id, step_order } = req.body;
  try {
    await pool.query(
      'UPDATE pot SET current_step = $1 WHERE recipe_id = $2',
      [step_order, recipe_id]
    );
    res.json({ recipe_id: recipe_id, step_id: step_order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
