const router = express.Router();
const potService = require('../services/pot.service')

router.get('/current-recipe', potService.getCurrentRecipe);
router.put('/current-recipe', potService.putCurrentRecipe);
router.post('/current-recipe', potService.postCurrentRecipe);
router.delete('/current-recipe', potService.deleteCurrentRecipe);

module.exports = router;