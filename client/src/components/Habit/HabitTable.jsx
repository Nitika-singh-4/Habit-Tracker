import React from 'react';
import HabitRow from './HabitRow';

const dayTones = [
  'bg-sky-100 text-sky-700',
  'bg-cyan-100 text-cyan-700',
  'bg-violet-100 text-violet-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
];

const getCurrentWeekDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jsDay = today.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayOfMonth: date.getDate(),
      tone: dayTones[index],
    };
  });
};

const HabitTable = ({ habits, completed, toggleHabit }) => {
  const visibleDays = getCurrentWeekDays();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/70">
      <table className="min-w-full table-fixed">
        <colgroup>
          <col className="w-56" />
          {visibleDays.map((day) => (
            <col key={`col-${day.value}`} className="w-16" />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-100 bg-white/85">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Study Item</th>
            {visibleDays.map((day) => (
              <th key={day.value} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full ${day.tone}`}>
                  {day.label}
                </div>
                {day.dayOfMonth}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <HabitRow
              key={habit}
              habitName={habit}
              days={visibleDays}
              completedData={completed}
              toggleHabit={toggleHabit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HabitTable;
