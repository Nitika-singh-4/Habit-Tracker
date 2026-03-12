const express = require('express');
const {
	getHabits,
	createHabit,
	updateHabit,
	deleteHabit,
} = require('../controllers/habitController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getHabits));
router.post('/', asyncHandler(createHabit));
router.put('/:id', asyncHandler(updateHabit));
router.delete('/:id', asyncHandler(deleteHabit));

module.exports = router;
