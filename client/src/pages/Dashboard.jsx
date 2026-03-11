import { useEffect, useMemo, useState } from 'react';
import HabitTable from '../components/Habit/HabitTable';
import AddHabit from '../components/Habit/AddHabit';
import HabitAnalytics from '../components/Analytics/HabitAnalytics';
import WeeklyAnalytics from '../components/Analytics/WeeklyAnalytics';
import TodayProgressRing from '../components/Progresss/TodayProgressRing';
import MonthlyStudyGrid from '../components/Habit/MonthlyStudyGrid';
import { getGoals as fetchGoals, updateGoals as saveGoals } from '../services/habitService';
import useHabits from '../hooks/useHabits';

const DEFAULT_GOALS = {
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

const normalizeGoalItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      text: String(item?.text || '').trim(),
      done: Boolean(item?.done),
    }))
    .filter((item) => item.text);
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
  const { habits, completed, addHabit, toggleHabit } = useHabits();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [newGoalText, setNewGoalText] = useState({
    daily: '',
    weekly: '',
    monthly: '',
  });

  const addGoalItem = (type) => {
    const text = String(newGoalText[type] || '').trim();
    if (!text) return;

    const key = `${type}Items`;
    setGoals((prev) => ({
      ...prev,
      [key]: [...prev[key], { text, done: false }],
    }));
    setNewGoalText((prev) => ({ ...prev, [type]: '' }));
  };

  const toggleGoalItem = (type, index) => {
    const key = `${type}Items`;
    setGoals((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const isCompletedForDate = (habit, date) => {
    const isoDate = date.toISOString().split('T')[0];
    const day = date.getDay() === 0 ? 7 : date.getDay();

    const dateKey = `${habit}-${isoDate}`;
    const dayKey = `${habit}-${day}`;
    return Boolean(completed[dateKey] ?? completed[dayKey]);
  };

  const countCompletedForDate = (date) => {
    return habits.reduce(
      (count, habit) => count + (isCompletedForDate(habit, date) ? 1 : 0),
      0
    );
  };

  const countCompletedForWindow = (days) => {
    let total = 0;
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - offset);
      total += countCompletedForDate(date);
    }
    return total;
  };

  const todayCompletedCount = countCompletedForDate(todayDate);
  const weekCompletedCount = countCompletedForWindow(7);
  const monthCompletedCount = countCompletedForWindow(30);
  const todayChecklistTotal = goals.dailyItems.length;
  const todayChecklistDone = goals.dailyItems.filter((item) => item.done).length;
  const weeklyChecklistTotal = goals.weeklyItems.length;
  const weeklyChecklistDone = goals.weeklyItems.filter((item) => item.done).length;
  const monthlyChecklistTotal = goals.monthlyItems.length;
  const monthlyChecklistDone = goals.monthlyItems.filter((item) => item.done).length;

  const safePercent = (value) => Math.max(0, Math.min(100, Math.round(value)));
  const todayHabitProgress = habits.length
    ? safePercent((todayCompletedCount / habits.length) * 100)
    : 0;
  const todayChecklistProgress = todayChecklistTotal > 0
    ? safePercent((todayChecklistDone / todayChecklistTotal) * 100)
    : 0;
  const weeklyGoalProgress = goals.weekly > 0
    ? safePercent((weekCompletedCount / goals.weekly) * 100)
    : 0;
  const weeklyChecklistProgress = weeklyChecklistTotal > 0
    ? safePercent((weeklyChecklistDone / weeklyChecklistTotal) * 100)
    : 0;
  const monthlyGoalProgress = goals.monthly > 0
    ? safePercent((monthCompletedCount / goals.monthly) * 100)
    : 0;
  const monthlyChecklistProgress = monthlyChecklistTotal > 0
    ? safePercent((monthlyChecklistDone / monthlyChecklistTotal) * 100)
    : 0;

  const todayProgress = todayChecklistTotal > 0 ? todayChecklistProgress : todayHabitProgress;
  const weeklyProgress = weeklyChecklistTotal > 0 ? weeklyChecklistProgress : weeklyGoalProgress;
  const monthlyProgress = monthlyChecklistTotal > 0 ? monthlyChecklistProgress : monthlyGoalProgress;

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
    const intervalId = setInterval(() => {
      setQuoteIndex((current) => (current + 1) % motivationalQuotes.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  const currentStreak = useMemo(() => {
    const checkDayCompletion = (date) => {
      const isoDate = date.toISOString().split('T')[0];
      const day = date.getDay() === 0 ? 7 : date.getDay();

      return habits.some((habit) => {
        const dateKey = `${habit}-${isoDate}`;
        const dayKey = `${habit}-${day}`;
        return Boolean(completed[dateKey] ?? completed[dayKey]);
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
      current: weeklyChecklistTotal > 0 ? weeklyChecklistDone : weekCompletedCount,
      goal: weeklyChecklistTotal > 0 ? weeklyChecklistTotal : goals.weekly,
      tone: 'from-violet-100 to-indigo-100',
      accent: 'bg-indigo-500',
    },
    {
      title: 'Monthly Progress',
      percentage: monthlyProgress,
      current: monthlyChecklistTotal > 0 ? monthlyChecklistDone : monthCompletedCount,
      goal: monthlyChecklistTotal > 0 ? monthlyChecklistTotal : goals.monthly,
      tone: 'from-orange-100 to-amber-100',
      accent: 'bg-amber-500',
    },
  ];

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
            completedCount={todayChecklistTotal > 0 ? todayChecklistDone : todayCompletedCount}
            totalCount={todayChecklistTotal > 0 ? todayChecklistTotal : habits.length}
          />

          {progressCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border border-white/70 bg-linear-to-br ${card.tone} p-5 shadow-lg shadow-slate-900/5`}
            >
              <h2 className="text-sm font-semibold text-slate-700">{card.title}</h2>
              <p className="mb-3 mt-1 text-4xl font-black text-slate-900">{card.percentage}%</p>
              <p className="mb-3 text-xs font-semibold text-slate-500">
                {card.current} / {card.goal || 0} goal completions
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
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    daily: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
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
                    <span className={item.done ? 'line-through text-slate-400' : ''}>{item.text}</span>
                  </label>
                ))}
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
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    weekly: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
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
                Current: {weekCompletedCount} completions in last 7 days
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Month Goal</label>
              <input
                type="number"
                min="0"
                value={goals.monthly}
                onChange={(event) =>
                  setGoals((prev) => ({
                    ...prev,
                    monthly: Math.max(0, Number(event.target.value) || 0),
                  }))
                }
                className="h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-slate-800 outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
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
                Current: {monthCompletedCount} completions in last 30 days
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

        <div className="mb-8">
          <AddHabit addHabit={addHabit} />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900">My Study Plan</h2>
          <HabitTable habits={habits} completed={completed} toggleHabit={toggleHabit} />
        </div>

        <MonthlyStudyGrid habits={habits} completed={completed} />

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <HabitAnalytics habits={habits} completed={completed} />
          <WeeklyAnalytics completed={completed} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
