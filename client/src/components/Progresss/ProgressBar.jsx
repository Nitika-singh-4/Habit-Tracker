const ProgressBar = ({ percentage = 0, label = 'Progress' }) => {
  const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">
          {safePercentage}%
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300 ease-out"
          style={{ width: `${safePercentage}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safePercentage}
          aria-label={label}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
