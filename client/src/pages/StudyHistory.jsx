import { useMemo, useState } from 'react';
import useHabits from '../hooks/useHabits';

const getSafeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthLabel = (date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const getWeekLabel = (date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekNumber = Math.ceil(
    ((startOfWeek - new Date(startOfWeek.getFullYear(), 0, 1)) / 86400000 + 1) / 7
  );

  const rangeLabel = `${startOfWeek.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${endOfWeek.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  return `Week ${weekNumber} (${rangeLabel})`;
};

const StudyHistory = () => {
  const { subjects } = useHabits();
  const [groupBy, setGroupBy] = useState('month');

  const subjectsWithCompletedTopics = useMemo(() => {
    return subjects.map((subject) => {
      const completedTopics = (subject.topics || [])
        .filter((topic) => topic.completed)
        .map((topic) => ({
          ...topic,
          completedDate: topic.completedDate || null,
        }));

      const grouped = completedTopics.reduce((acc, topic) => {
        const date = getSafeDate(topic.completedDate);
        const key = date
          ? groupBy === 'week'
            ? getWeekLabel(date)
            : getMonthLabel(date)
          : 'Unknown Date';

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(topic);
        return acc;
      }, {});

      return {
        ...subject,
        groupedCompletedTopics: grouped,
      };
    });
  }, [subjects, groupBy]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50 to-indigo-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Study History</h1>
              <p className="mt-1 text-sm text-slate-600">
                Review completed topics and track your consistency over time.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setGroupBy('week')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  groupBy === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Group by Week
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('month')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  groupBy === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Group by Month
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-5">
          {subjectsWithCompletedTopics.map((subject) => {
            const groups = Object.entries(subject.groupedCompletedTopics);

            return (
              <section
                key={subject.id}
                className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm"
              >
                <h2 className="mb-3 text-xl font-bold text-slate-900">{subject.name}</h2>

                {groups.length ? (
                  <div className="space-y-4">
                    {groups.map(([groupLabel, topics]) => (
                      <div key={groupLabel} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {groupLabel}
                        </h3>

                        <ul className="space-y-2">
                          {topics.map((topic) => (
                            <li
                              key={`${subject.id}-${topic.id}`}
                              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
                            >
                              <span className="text-sm font-medium text-slate-700">{topic.title}</span>
                              <span className="text-xs font-semibold text-indigo-600">
                                {topic.completedDate || 'Unknown'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No completed topics for this subject yet.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudyHistory;
