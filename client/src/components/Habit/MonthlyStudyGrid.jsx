const weekBlocks = [
  { week: 'Week 1', startDay: 1, endDay: 7, tone: 'bg-sky-100 text-sky-700' },
  { week: 'Week 2', startDay: 8, endDay: 14, tone: 'bg-violet-100 text-violet-700' },
  { week: 'Week 3', startDay: 15, endDay: 21, tone: 'bg-amber-100 text-amber-700' },
  { week: 'Week 4', startDay: 22, endDay: 28, tone: 'bg-rose-100 text-rose-700' },
];

const allDays = weekBlocks.flatMap((block) =>
  Array.from({ length: 7 }, (_, index) => block.startDay + index)
);

const MonthlyStudyGrid = ({ habits, completed }) => {
  const getDayCompletion = (habit, dayOfMonth) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    const isoDate = date.toISOString().split('T')[0];

    const byDateKey = `${habit}-${isoDate}`;
    const byDayOfMonthKey = `${habit}-${dayOfMonth}`;

    return Boolean(completed[byDateKey] ?? completed[byDayOfMonthKey]);
  };

  return (
    <section className="mt-8 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Monthly Study Grid</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Week 1 to Week 4
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/80">
        <table className="min-w-245 table-fixed">
          <thead>
            <tr className="border-b border-slate-100 bg-white/90">
              <th className="w-48 px-4 py-3 text-left text-sm font-semibold text-slate-700">Study Item</th>
              {weekBlocks.map((block) => (
                <th
                  key={block.week}
                  colSpan={7}
                  className="px-2 py-3 text-center"
                >
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${block.tone}`}>
                    {block.week}
                  </span>
                </th>
              ))}
            </tr>

            <tr className="border-b border-slate-100 bg-white/80">
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Days
              </th>
              {allDays.map((day) => (
                <th key={`day-${day}`} className="px-2 py-2 text-center text-xs font-bold text-slate-500">
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {habits.map((habit) => (
              <tr key={habit} className="border-b border-slate-100/70 last:border-b-0 hover:bg-white/70">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">{habit}</td>
                {allDays.map((day) => {
                  const checked = getDayCompletion(habit, day);

                  return (
                    <td key={`${habit}-${day}`} className="px-2 py-2 text-center">
                      <div
                        className={`mx-auto h-6 w-6 rounded-md border transition ${
                          checked
                            ? 'border-indigo-300 bg-linear-to-br from-sky-100 to-indigo-100 shadow-sm shadow-sky-100'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {checked ? <span className="inline-block pt-px text-xs text-indigo-700">✓</span> : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MonthlyStudyGrid;
