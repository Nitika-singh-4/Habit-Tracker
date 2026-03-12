import { useMemo, useState } from 'react';

const DailyStudyTracker = ({
  subjects = [],
  studyLog: externalStudyLog,
  onStudyLogChange,
  onToggleStudiedToday,
}) => {
  const [internalStudyLog, setInternalStudyLog] = useState({});

  const hasExternalStudyLog = Boolean(externalStudyLog);
  const studyLog = hasExternalStudyLog ? externalStudyLog : internalStudyLog;
  const setStudyLog = onStudyLogChange || setInternalStudyLog;

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const studiedToday = studyLog[todayDate] || [];

  const toggleStudiedToday = (subjectName) => {
    if (typeof onToggleStudiedToday === 'function') {
      onToggleStudiedToday(subjectName, todayDate);
      return;
    }

    setStudyLog((prevLog) => {
      const todaysSubjects = prevLog[todayDate] || [];
      const alreadyStudied = todaysSubjects.includes(subjectName);

      const updatedTodaysSubjects = alreadyStudied
        ? todaysSubjects.filter((name) => name !== subjectName)
        : [...todaysSubjects, subjectName];

      return {
        ...prevLog,
        [todayDate]: updatedTodaysSubjects,
      };
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Daily Study Tracker</h2>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          {todayDate}
        </span>
      </div>

      <ul className="space-y-2">
        {subjects.length ? (
          subjects.map((subject) => {
            const subjectName = typeof subject === 'string' ? subject : subject?.name;
            if (!subjectName) return null;

            const checked = studiedToday.includes(subjectName);

            return (
              <li
                key={subjectName}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">{subjectName}</span>

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStudiedToday(subjectName)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                />
              </li>
            );
          })
        ) : (
          <li className="text-sm text-slate-500">No subjects available yet.</li>
        )}
      </ul>

      <div className="mt-4 rounded-xl bg-slate-100 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Study Log (Today)
        </p>
        <p className="text-sm text-slate-700">
          {studiedToday.length ? studiedToday.join(', ') : 'No subjects marked as studied today.'}
        </p>
      </div>
    </section>
  );
};

export default DailyStudyTracker;
