import { useEffect, useMemo, useState } from 'react';
import HabitTable from '../components/Habit/HabitTable';
import HabitAnalytics from '../components/Analytics/HabitAnalytics';
import WeeklyAnalytics from '../components/Analytics/WeeklyAnalytics';
import TodayProgressRing from '../components/Progresss/TodayProgressRing';
import MonthlyStudyGrid from '../components/Habit/MonthlyStudyGrid';
import DailyStudyTracker from '../components/DailyStudyTracker';
import WeeklyCoverage from '../components/WeeklyCoverage';
import { getGoals as fetchGoals, updateGoals as saveGoals } from '../services/habitService';
import { calculateMonthlyProgress } from '../utils/progressCalculator';
import useHabits from '../hooks/useHabits';

const DEFAULT_GOALS = {
  daily: 0,
  weekly: 0,
  monthly: 0,
  dailyText: '',
  weeklyText: '',
  monthlyText: '',
  dailyItems: [],
  weeklyItems: [],
  monthlyItems: [],
};

const normalizeGoalItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      text: String(item?.text || '').trim(),
      done: Boolean(item?.done),
      linkedSubjectId: String(item?.linkedSubjectId || '').trim(),
      linkedTopicId: String(item?.linkedTopicId || '').trim(),
    }))
    .filter((item) => item.text);
};

const hasLinkedItemsStateChanged = (previousItems, nextItems) => {
  if (previousItems.length !== nextItems.length) return true;

  return previousItems.some((item, index) => {
    const nextItem = nextItems[index];
    return (
      item.text !== nextItem.text ||
      item.done !== nextItem.done ||
      String(item.linkedSubjectId || '') !== String(nextItem.linkedSubjectId || '') ||
      String(item.linkedTopicId || '') !== String(nextItem.linkedTopicId || '')
    );
  });
};

const syncLinkedItemsWithSubjects = (items, subjects) => {
  if (!Array.isArray(items) || !items.length) return items || [];

  return items.map((item) => {
    const linkedSubjectId = String(item?.linkedSubjectId || '');
    const linkedTopicId = String(item?.linkedTopicId || '');
    if (!linkedSubjectId || !linkedTopicId) return item;

    const subject = subjects.find((subjectItem) => subjectItem.id === linkedSubjectId);
    const topic = subject?.topics?.find((topicItem) => topicItem.id === linkedTopicId);
    if (!topic) return item;

    return {
      ...item,
      done: Boolean(topic.completed),
      text: String(item.text || topic.title || ''),
    };
  });
};

const normalizeGoals = (goals) => ({
  daily: Math.max(0, Number(goals?.daily) || 0),
  weekly: Math.max(0, Number(goals?.weekly) || 0),
  monthly: Math.max(0, Number(goals?.monthly) || 0),
  dailyText: typeof goals?.dailyText === 'string' ? goals.dailyText : '',
  weeklyText: typeof goals?.weeklyText === 'string' ? goals.weeklyText : '',
  monthlyText: typeof goals?.monthlyText === 'string' ? goals.monthlyText : '',
  dailyItems: normalizeGoalItems(goals?.dailyItems),
  weeklyItems: normalizeGoalItems(goals?.weeklyItems),
  monthlyItems: normalizeGoalItems(goals?.monthlyItems),
});

const motivationalQuotes = [
  'One focused hour today is worth more than ten distracted hours tomorrow.',
  'Progress is built in quiet, consistent study sessions.',
  'Your future self is cheering for the effort you put in right now.',
  'Small study wins every day become unstoppable momentum.',
  'Stay patient, stay consistent, and trust your preparation.',
];

const Dashboard = () => {
  const {
    subjects,
    studyLog,
    habits,
    completed,
    addHabit,
    toggleHabit,
    addTopic,
    toggleTopicCompletion,
  } = useHabits();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [newGoalText, setNewGoalText] = useState({
    daily: '',
    weekly: '',
    monthly: '',
  });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectTopicTitle, setNewSubjectTopicTitle] = useState('');
  const [goalLinkedSubjectId, setGoalLinkedSubjectId] = useState('');
  const [goalLinkedTopicId, setGoalLinkedTopicId] = useState('');

  const todayIsoDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const addGoalItem = (type) => {
    const text = String(newGoalText[type] || '').trim();
    if (!text) return;

    const key = `${type}Items`;
    const goalKey = type;
    setGoals((prev) => ({
      ...prev,
      [goalKey]: Math.max(0, Number(prev[goalKey]) || 0, prev[key].length + 1),
      [key]: [...prev[key], { text, done: false, linkedSubjectId: '', linkedTopicId: '' }],
    }));
    setNewGoalText((prev) => ({ ...prev, [type]: '' }));
  };

  const toggleGoalItem = async (type, index) => {
    const key = `${type}Items`;

    const goalItem = goals[key]?.[index];
    const hasLinkedTopic =
      type === 'daily' &&
      Boolean(goalItem?.linkedSubjectId) &&
      Boolean(goalItem?.linkedTopicId);

    if (hasLinkedTopic) {
      await toggleTopicCompletion(goalItem.linkedSubjectId, goalItem.linkedTopicId);
      return;
    }

    setGoals((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const addLinkedDailyGoalItem = () => {
    const subject = subjects.find((subjectItem) => subjectItem.id === goalLinkedSubjectId);
    if (!subject) return;

    const topic = subject.topics?.find((topicItem) => topicItem.id === goalLinkedTopicId);
    if (!topic) return;

    setGoals((prev) => ({
      ...prev,
      daily: Math.max(0, Number(prev.daily) || 0, prev.dailyItems.length + 1),
      dailyItems: [
        ...prev.dailyItems,
        {
          text: topic.title,
          done: Boolean(topic.completed),
          linkedSubjectId: subject.id,
          linkedTopicId: topic.id,
        },
      ],
    }));
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const isCompletedForDate = (habit, date) => {
    const isoDate = date.toISOString().split('T')[0];
    const dateKey = `${habit}-${isoDate}`;
    return Boolean(completed[dateKey]);
  };

  const countCompletedForDate = (date) => {
    return habits.reduce(
      (count, habit) => count + (isCompletedForDate(habit, date) ? 1 : 0),
      0
    );
  };

  const countCompletedInRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let total = 0;
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      total += countCompletedForDate(date);
    }

    return total;
  };

  const weekStartDate = new Date(todayDate);
  const currentJsDay = todayDate.getDay();
  const mondayOffset = currentJsDay === 0 ? -6 : 1 - currentJsDay;
  weekStartDate.setDate(todayDate.getDate() + mondayOffset);

  const monthStartDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

  const todayCompletedCount = countCompletedForDate(todayDate);
  const weekCompletedCount = countCompletedInRange(weekStartDate, todayDate);
  const monthCompletedCount = countCompletedInRange(monthStartDate, todayDate);

  const dailyChecklistTotal = goals.dailyItems.length;
  const weeklyChecklistTotal = goals.weeklyItems.length;
  const monthlyChecklistTotal = goals.monthlyItems.length;

  const dailyChecklistDone = goals.dailyItems.filter((item) => item.done).length;
  const weeklyChecklistDone = goals.weeklyItems.filter((item) => item.done).length;
  const monthlyChecklistDone = goals.monthlyItems.filter((item) => item.done).length;

  const effectiveDailyGoal = dailyChecklistTotal > 0 ? dailyChecklistTotal : goals.daily;
  const effectiveWeeklyGoal = weeklyChecklistTotal > 0 ? weeklyChecklistTotal : goals.weekly;
  const effectiveMonthlyGoal = monthlyChecklistTotal > 0 ? monthlyChecklistTotal : goals.monthly;

  const effectiveTodayCompleted = dailyChecklistTotal > 0 ? dailyChecklistDone : todayCompletedCount;
  const effectiveWeekCompleted = weeklyChecklistTotal > 0 ? weeklyChecklistDone : weekCompletedCount;
  const effectiveMonthCompleted = monthlyChecklistTotal > 0 ? monthlyChecklistDone : monthCompletedCount;

  const safePercent = (value) => Math.max(0, Math.min(100, Math.round(value)));
  const todayGoalProgress = effectiveDailyGoal > 0
    ? safePercent((effectiveTodayCompleted / effectiveDailyGoal) * 100)
    : 0;
  const weeklyGoalProgress = effectiveWeeklyGoal > 0
    ? safePercent((effectiveWeekCompleted / effectiveWeeklyGoal) * 100)
    : 0;
  const monthlyGoalProgress = effectiveMonthlyGoal > 0
    ? safePercent((effectiveMonthCompleted / effectiveMonthlyGoal) * 100)
    : 0;

  const todayProgress = todayGoalProgress;
  const weeklyProgress = weeklyGoalProgress;
  const monthlyProgress = monthlyGoalProgress;

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const apiGoals = await fetchGoals();
        setGoals(normalizeGoals(apiGoals));
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        setGoals(DEFAULT_GOALS);
      } finally {
        setGoalsLoaded(true);
      }
    };

    loadGoals();
  }, []);

  useEffect(() => {
    if (!goalsLoaded) return;

    const timeoutId = setTimeout(async () => {
      try {
        await saveGoals(goals);
      } catch (error) {
        console.error('Failed to save goals:', error);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [goals, goalsLoaded]);

  useEffect(() => {
    if (!goalsLoaded) return;

    setGoals((prev) => {
      const next = { ...prev };
      let changed = false;

      const syncGoalWithChecklist = (type) => {
        const itemsKey = `${type}Items`;
        const checklistTotal = Array.isArray(prev[itemsKey]) ? prev[itemsKey].length : 0;

        if (checklistTotal > 0 && Number(prev[type]) !== checklistTotal) {
          next[type] = checklistTotal;
          changed = true;
        }
      };

      syncGoalWithChecklist('daily');
      syncGoalWithChecklist('weekly');
      syncGoalWithChecklist('monthly');

      return changed ? next : prev;
    });
  }, [
    goalsLoaded,
    goals.dailyItems.length,
    goals.weeklyItems.length,
    goals.monthlyItems.length,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setQuoteIndex((current) => (current + 1) % motivationalQuotes.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  const currentStreak = useMemo(() => {
    const checkDayCompletion = (date) => {
      const isoDate = date.toISOString().split('T')[0];

      return habits.some((habit) => {
        const dateKey = `${habit}-${isoDate}`;
        return Boolean(completed[dateKey]);
      });
    };

    let streak = 0;
    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      if (checkDayCompletion(date)) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }, [completed, habits]);

  const progressCards = [
    {
      title: 'Weekly Progress',
      percentage: weeklyProgress,
      current: effectiveWeekCompleted,
      goal: effectiveWeeklyGoal,
      remaining: Math.max((effectiveWeeklyGoal || 0) - effectiveWeekCompleted, 0),
      tone: 'from-violet-100 to-indigo-100',
      accent: 'bg-indigo-500',
    },
    {
      title: 'Monthly Progress',
      percentage: monthlyProgress,
      current: effectiveMonthCompleted,
      goal: effectiveMonthlyGoal,
      remaining: Math.max((effectiveMonthlyGoal || 0) - effectiveMonthCompleted, 0),
      tone: 'from-orange-100 to-amber-100',
      accent: 'bg-amber-500',
    },
  ];

  const monthlySummary = useMemo(() => calculateMonthlyProgress(subjects), [subjects]);

  useEffect(() => {
    if (!subjects.length) {
      setSelectedSubjectId('');
      return;
    }

    if (!selectedSubjectId || !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (!subjects.length) {
      setGoalLinkedSubjectId('');
      setGoalLinkedTopicId('');
      return;
    }

    if (!goalLinkedSubjectId || !subjects.some((subject) => subject.id === goalLinkedSubjectId)) {
      setGoalLinkedSubjectId(subjects[0].id);
      return;
    }

    const selectedGoalSubject = subjects.find((subject) => subject.id === goalLinkedSubjectId);
    const availableTopics = selectedGoalSubject?.topics || [];

    if (!availableTopics.length) {
      setGoalLinkedTopicId('');
      return;
    }

    if (!goalLinkedTopicId || !availableTopics.some((topic) => topic.id === goalLinkedTopicId)) {
      setGoalLinkedTopicId(availableTopics[0].id);
    }
  }, [subjects, goalLinkedSubjectId, goalLinkedTopicId]);

  useEffect(() => {
    if (!goalsLoaded) return;

    setGoals((prev) => {
      const nextDailyItems = syncLinkedItemsWithSubjects(prev.dailyItems, subjects);
      if (!hasLinkedItemsStateChanged(prev.dailyItems, nextDailyItems)) {
        return prev;
      }

      return {
        ...prev,
        dailyItems: nextDailyItems,
      };
    });
  }, [subjects, goalsLoaded]);

  const handleAddSubject = async (event) => {
    event.preventDefault();

    const trimmedName = newSubjectName.trim();
    if (!trimmedName) return;

    await addHabit(trimmedName);
    setNewSubjectName('');
  };

  const handleAddTopicToSelectedSubject = async (event) => {
    event.preventDefault();

    const trimmedTitle = newSubjectTopicTitle.trim();
    if (!trimmedTitle || !selectedSubjectId) return;

    await addTopic(selectedSubjectId, trimmedTitle);
    setNewSubjectTopicTitle('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-sky-50 via-rose-50 to-indigo-50 px-4 py-6 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-fuchsia-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl">
        <header className="mb-7 rounded-3xl border border-white/70 bg-white/65 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Focus Dashboard
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Study Tracker Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Show up today. Small sessions become big results.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TodayProgressRing
            percentage={todayProgress}
            completedCount={effectiveTodayCompleted}
            totalCount={effectiveDailyGoal}
          />

          {progressCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border border-white/70 bg-linear-to-br ${card.tone} p-5 shadow-lg shadow-slate-900/5`}
            >
              <h2 className="text-sm font-semibold text-slate-700">{card.title}</h2>
              <p className="mb-3 mt-1 text-4xl font-black text-slate-900">{card.percentage}%</p>
              <p className="mb-3 text-xs font-semibold text-slate-500">
                Completed: {card.current} | Remaining: {card.remaining}
              </p>
              <div className="h-2.5 w-full rounded-full bg-white/70">
                <div
                  className={`h-full rounded-full ${card.accent} transition-all duration-500 ease-out`}
                  style={{ width: `${card.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-rose-100 bg-white/75 p-4 shadow-md shadow-rose-200/30 backdrop-blur sm:flex-row sm:items-center sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Daily Motivation</p>
            <p className="mt-1 text-sm font-medium text-slate-700 sm:text-base">
              {motivationalQuotes[quoteIndex]}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full bg-linear-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-semibold text-amber-700">
            {currentStreak} Day Streak
          </span>
        </div>

        <section className="mb-8 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Goal Setter</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Set Your Daily Targets
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Present Day Goal</label>
              <input
                type="number"
                min="0"
                value={goals.daily}
                disabled={goals.dailyItems.length > 0}
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    daily: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              {goals.dailyItems.length > 0 ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Daily goal is auto-managed from checklist items.
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newGoalText.daily}
                  onChange={(event) =>
                    setNewGoalText((prev) => ({ ...prev, daily: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addGoalItem('daily');
                    }
                  }}
                  placeholder="Add daily goal item"
                  className="h-10 flex-1 rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={() => addGoalItem('daily')}
                  className="h-10 rounded-xl bg-sky-500 px-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                >
                  Add
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {goals.dailyItems.map((item, index) => (
                  <label key={`daily-item-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleGoalItem('daily', index)}
                      className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-300"
                    />
                    <span className={item.done ? 'line-through text-slate-400' : ''}>
                      {item.text}
                      {item.linkedSubjectId && item.linkedTopicId ? ' (Linked)' : ''}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-sky-200 bg-white/85 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                  Link Daily Goal With Topic
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={goalLinkedSubjectId}
                    onChange={(event) => setGoalLinkedSubjectId(event.target.value)}
                    className="h-10 rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="" disabled>
                      Select subject
                    </option>
                    {subjects.map((subject) => (
                      <option key={`goal-subject-${subject.id}`} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={goalLinkedTopicId}
                    onChange={(event) => setGoalLinkedTopicId(event.target.value)}
                    className="h-10 rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    disabled={!goalLinkedSubjectId}
                  >
                    <option value="" disabled>
                      Select topic
                    </option>
                    {(subjects.find((subject) => subject.id === goalLinkedSubjectId)?.topics || []).map((topic) => (
                      <option key={`goal-topic-${topic.id}`} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addLinkedDailyGoalItem}
                  className="mt-2 h-10 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  disabled={!goalLinkedSubjectId || !goalLinkedTopicId}
                >
                  Add Linked Topic Goal
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">
                Current: {todayCompletedCount} completed today
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-indigo-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Week Goal</label>
              <input
                type="number"
                min="0"
                value={goals.weekly}
                disabled={goals.weeklyItems.length > 0}
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    weekly: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
              {goals.weeklyItems.length > 0 ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Weekly goal is auto-managed from checklist items.
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newGoalText.weekly}
                  onChange={(event) =>
                    setNewGoalText((prev) => ({ ...prev, weekly: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addGoalItem('weekly');
                    }
                  }}
                  placeholder="Add weekly goal item"
                  className="h-10 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => addGoalItem('weekly')}
                  className="h-10 rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-600"
                >
                  Add
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {goals.weeklyItems.map((item, index) => (
                  <label key={`weekly-item-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleGoalItem('weekly', index)}
                      className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-300"
                    />
                    <span className={item.done ? 'line-through text-slate-400' : ''}>{item.text}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">
                This week: {effectiveWeekCompleted} completed, {Math.max((effectiveWeeklyGoal || 0) - effectiveWeekCompleted, 0)} remaining
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Month Goal</label>
              <input
                type="number"
                min="0"
                value={goals.monthly}
                disabled={goals.monthlyItems.length > 0}
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    monthly: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-slate-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
              {goals.monthlyItems.length > 0 ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Monthly goal is auto-managed from checklist items.
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newGoalText.monthly}
                  onChange={(event) =>
                    setNewGoalText((prev) => ({ ...prev, monthly: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addGoalItem('monthly');
                    }
                  }}
                  placeholder="Add monthly goal item"
                  className="h-10 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                />
                <button
                  type="button"
                  onClick={() => addGoalItem('monthly')}
                  className="h-10 rounded-xl bg-amber-500 px-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Add
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {goals.monthlyItems.map((item, index) => (
                  <label key={`monthly-item-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleGoalItem('monthly', index)}
                      className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-300"
                    />
                    <span className={item.done ? 'line-through text-slate-400' : ''}>{item.text}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600">
                This month: {effectiveMonthCompleted} completed, {Math.max((effectiveMonthlyGoal || 0) - effectiveMonthCompleted, 0)} remaining
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-sky-100/70 px-3 py-2 text-xs font-medium text-slate-700">
              Daily checklist: {goals.dailyItems.filter((item) => item.done).length}/{goals.dailyItems.length || 0} done
            </div>
            <div className="rounded-xl bg-violet-100/70 px-3 py-2 text-xs font-medium text-slate-700">
              Weekly checklist: {goals.weeklyItems.filter((item) => item.done).length}/{goals.weeklyItems.length || 0} done
            </div>
            <div className="rounded-xl bg-amber-100/70 px-3 py-2 text-xs font-medium text-slate-700">
              Monthly checklist: {goals.monthlyItems.filter((item) => item.done).length}/{goals.monthlyItems.length || 0} done
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Subject and Topic Creator</h2>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              Add subject first, then add topics
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <form onSubmit={handleAddSubject} className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Add Subject</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(event) => setNewSubjectName(event.target.value)}
                  placeholder="Example: JavaScript"
                  className="h-10 flex-1 rounded-xl border border-sky-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Add Subject
                </button>
              </div>
            </form>

            <form
              onSubmit={handleAddTopicToSelectedSubject}
              className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-indigo-50 p-4"
            >
              <label className="mb-2 block text-sm font-semibold text-slate-700">Add Topic To Subject</label>
              <div className="mb-2">
                <select
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(event.target.value)}
                  className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="" disabled>
                    Select subject
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectTopicTitle}
                  onChange={(event) => setNewSubjectTopicTitle(event.target.value)}
                  placeholder="Example: Closures"
                  className="h-10 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
                  disabled={!subjects.length}
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DailyStudyTracker
            subjects={subjects}
            studyLog={studyLog}
            onToggleStudiedToday={(subjectName) => toggleHabit(subjectName, todayIsoDate)}
          />
          <WeeklyCoverage subjects={subjects} studyLog={studyLog} />
        </div>

        <section className="mb-8 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900">MonthlyProgress Summary</h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              {monthlySummary.totals.overallCompletionPercentage}% overall
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total Topics</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{monthlySummary.totals.totalTopics}</p>
            </div>
            <div className="rounded-xl bg-emerald-100/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Completed</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{monthlySummary.totals.completedTopics}</p>
            </div>
            <div className="rounded-xl bg-amber-100/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Remaining</p>
              <p className="mt-1 text-2xl font-black text-amber-800">{monthlySummary.totals.remainingTopics}</p>
            </div>
            <div className="rounded-xl bg-indigo-100/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">Monthly Goal</p>
              <p className="mt-1 text-2xl font-black text-indigo-800">{effectiveMonthlyGoal}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Overall Progress</p>
              <p className="text-sm font-bold text-slate-800">
                {monthlySummary.totals.completedTopics}/{monthlySummary.totals.totalTopics || 0}
              </p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${monthlySummary.totals.overallCompletionPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {monthlySummary.subjectProgress.map((subject) => (
              <div key={subject.id || subject.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
                  <p className="text-xs font-semibold text-slate-600">
                    {subject.completedTopics}/{subject.totalTopics || 0}
                  </p>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${subject.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900">My Study Plan</h2>
          <HabitTable habits={habits} completed={completed} toggleHabit={toggleHabit} />
        </div>

        <MonthlyStudyGrid habits={habits} completed={completed} />

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <HabitAnalytics subjects={subjects} />
          <WeeklyAnalytics subjects={subjects} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
