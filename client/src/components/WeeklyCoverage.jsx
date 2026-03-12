const getLast7Dates = () => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return date.toISOString().split('T')[0];
  });
};

const WeeklyCoverage = ({ subjects = [], studyLog = {} }) => {
  const last7Dates = getLast7Dates();

  const subjectNames = subjects
    .map((subject) => (typeof subject === 'string' ? subject : subject?.name))
    .filter(Boolean);

  const coverageRows = subjectNames.map((subjectName) => {
    const studiedDays = last7Dates.reduce((count, date) => {
      const subjectsForDate = studyLog[date] || [];
      return count + (subjectsForDate.includes(subjectName) ? 1 : 0);
    }, 0);

    const percentage = Math.round((studiedDays / 7) * 100);

    return {
      subjectName,
      studiedDays,
      percentage,
    };
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Weekly Coverage</h2>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          Last 7 Days
        </span>
      </div>

      <div className="space-y-3">
        {coverageRows.length ? (
          coverageRows.map((row) => (
            <div key={row.subjectName} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{row.subjectName}</p>
                <p className="text-xs font-medium text-slate-600">{row.studiedDays}/7 days</p>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No subjects available to calculate weekly coverage.</p>
        )}
      </div>
    </section>
  );
};

export default WeeklyCoverage;
