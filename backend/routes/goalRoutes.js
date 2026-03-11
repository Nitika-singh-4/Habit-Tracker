const express = require('express');
const { getGoals, updateGoals } = require('../controllers/goalController');

const router = express.Router();

router.get('/', getGoals);
router.put('/', updateGoals);

module.exports = router;
