const TodayProgressRing = ({ percentage, completedCount, totalCount }) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, Number(percentage) || 0));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
        Today Progress
      </p>

      <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 450ms ease' }}
            />
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900">{progress}%</span>
            <span className="text-xs font-medium text-slate-500">Completed</span>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {completedCount} of {totalCount || 0} tasks finished today
        </p>
      </div>
    </section>
  );
};

export default TodayProgressRing;
