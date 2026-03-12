const Habit = require('../models/habit');

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const normalizeCompletionEntry = (key, value) => {
	if (typeof value === 'boolean') {
		return {
			done: value,
			completedDate: value && isIsoDate(key) ? key : undefined,
		};
	}

	if (value && typeof value === 'object') {
		const done = Boolean(value.done ?? value.completed);
		const completedDate =
			typeof value.completedDate === 'string' && isIsoDate(value.completedDate)
				? value.completedDate
				: done && isIsoDate(key)
					? key
					: undefined;

		return {
			done,
			completedDate,
		};
	}

	const done = Boolean(value);
	return {
		done,
		completedDate: done && isIsoDate(key) ? key : undefined,
	};
};

const normalizeCompletionsPayload = (completions) => {
	if (!completions || typeof completions !== 'object') return {};

	const entries = completions instanceof Map
		? Array.from(completions.entries())
		: Object.entries(completions);

	return entries.reduce((acc, [rawKey, value]) => {
		const key = String(rawKey);
		acc[key] = normalizeCompletionEntry(key, value);
		return acc;
	}, {});
};

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
		completions: normalizeCompletionsPayload(req.body?.completions),
	});

	return res.status(201).json(habit);
};

const updateHabit = async (req, res) => {
	const { id } = req.params;
	const updates = {};

	if (typeof req.body?.name === 'string') {
		const trimmedName = req.body.name.trim();
		if (!trimmedName) {
			return res.status(400).json({ message: 'Habit name cannot be empty.' });
		}

		updates.name = trimmedName;
	}

	if (req.body?.completions && typeof req.body.completions === 'object') {
		updates.completions = normalizeCompletionsPayload(req.body.completions);
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
