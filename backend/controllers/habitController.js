const Habit = require('../models/habit');

const getHabits = async (_req, res) => {
	const habits = await Habit.find().sort({ createdAt: -1 });
	res.status(200).json(habits);
};

const createHabit = async (req, res) => {
	const name = String(req.body?.name || '').trim();

	if (!name) {
		return res.status(400).json({ message: 'Habit name is required.' });
	}

	const habit = await Habit.create({
		name,
		completions: req.body?.completions || {},
	});

	return res.status(201).json(habit);
};

const updateHabit = async (req, res) => {
	const { id } = req.params;
	const updates = {};

	if (typeof req.body?.name === 'string') {
		updates.name = req.body.name.trim();
	}

	if (req.body?.completions && typeof req.body.completions === 'object') {
		updates.completions = req.body.completions;
	}

	const habit = await Habit.findByIdAndUpdate(id, updates, {
		new: true,
		runValidators: true,
	});

	if (!habit) {
		return res.status(404).json({ message: 'Habit not found.' });
	}

	return res.status(200).json(habit);
};

const deleteHabit = async (req, res) => {
	const { id } = req.params;
	const habit = await Habit.findByIdAndDelete(id);

	if (!habit) {
		return res.status(404).json({ message: 'Habit not found.' });
	}

	return res.status(200).json({ message: 'Habit deleted successfully.' });
};

module.exports = {
	getHabits,
	createHabit,
	updateHabit,
	deleteHabit,
};
