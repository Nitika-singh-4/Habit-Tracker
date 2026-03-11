const Goal = require('../models/goal');

const defaultGoals = {
  daily: 3,
  weekly: 15,
  monthly: 60,
  dailyText: '',
  weeklyText: '',
  monthlyText: '',
  dailyItems: [],
  weeklyItems: [],
  monthlyItems: [],
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      text: String(item?.text || '').trim(),
      done: Boolean(item?.done),
    }))
    .filter((item) => item.text.length > 0);
};

const getGoals = async (_req, res) => {
  let goals = await Goal.findOne();

  if (!goals) {
    goals = await Goal.create(defaultGoals);
  }

  return res.status(200).json(goals);
};

const updateGoals = async (req, res) => {
  const payload = {
    daily: Math.max(0, Number(req.body?.daily) || 0),
    weekly: Math.max(0, Number(req.body?.weekly) || 0),
    monthly: Math.max(0, Number(req.body?.monthly) || 0),
    dailyText: String(req.body?.dailyText || ''),
    weeklyText: String(req.body?.weeklyText || ''),
    monthlyText: String(req.body?.monthlyText || ''),
    dailyItems: normalizeItems(req.body?.dailyItems),
    weeklyItems: normalizeItems(req.body?.weeklyItems),
    monthlyItems: normalizeItems(req.body?.monthlyItems),
  };

  const existing = await Goal.findOne();

  if (!existing) {
    const created = await Goal.create({ ...defaultGoals, ...payload });
    return res.status(200).json(created);
  }

  existing.daily = payload.daily;
  existing.weekly = payload.weekly;
  existing.monthly = payload.monthly;
  existing.dailyText = payload.dailyText;
  existing.weeklyText = payload.weeklyText;
  existing.monthlyText = payload.monthlyText;
  existing.dailyItems = payload.dailyItems;
  existing.weeklyItems = payload.weeklyItems;
  existing.monthlyItems = payload.monthlyItems;

  await existing.save();
  return res.status(200).json(existing);
};

module.exports = {
  getGoals,
  updateGoals,
};
