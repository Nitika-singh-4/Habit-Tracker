const express = require('express');
const {
	getHabits,
	createHabit,
	updateHabit,
	deleteHabit,
} = require('../controllers/habitController');

const router = express.Router();

router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
