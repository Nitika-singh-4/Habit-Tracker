import React from 'react';
import HabitRow from './HabitRow';

const daysInWeek = [
  { value: 1, label: 'M', tone: 'bg-sky-100 text-sky-700' },
  { value: 2, label: 'T', tone: 'bg-cyan-100 text-cyan-700' },
  { value: 3, label: 'W', tone: 'bg-violet-100 text-violet-700' },
  { value: 4, label: 'T', tone: 'bg-indigo-100 text-indigo-700' },
  { value: 5, label: 'F', tone: 'bg-amber-100 text-amber-700' },
  { value: 6, label: 'S', tone: 'bg-orange-100 text-orange-700' },
  { value: 7, label: 'S', tone: 'bg-rose-100 text-rose-700' },
];

const HabitTable = ({ habits, completed, toggleHabit }) => {
  const visibleDays = daysInWeek.slice(0, 7);

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
                {day.value}
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
