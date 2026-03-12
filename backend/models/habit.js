const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		completions: {
			type: Map,
			of: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Habit', habitSchema);
