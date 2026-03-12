const mongoose = require('mongoose');

const goalItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
    linkedSubjectId: {
      type: String,
      default: '',
      trim: true,
    },
    linkedTopicId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    daily: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekly: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthly: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyText: {
      type: String,
      default: '',
      trim: true,
    },
    weeklyText: {
      type: String,
      default: '',
      trim: true,
    },
    monthlyText: {
      type: String,
      default: '',
      trim: true,
    },
    dailyItems: {
      type: [goalItemSchema],
      default: [],
    },
    weeklyItems: {
      type: [goalItemSchema],
      default: [],
    },
    monthlyItems: {
      type: [goalItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
