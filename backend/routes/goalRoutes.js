const express = require('express');
const { getGoals, updateGoals } = require('../controllers/goalController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getGoals));
router.put('/', asyncHandler(updateGoals));

module.exports = router;
