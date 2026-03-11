const HabitCheckbox = ({ checked, onToggle, label }) => {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={label}
			aria-pressed={checked}
			className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl border text-lg leading-none transition duration-200 ${
				checked
					? 'border-sky-300 bg-linear-to-br from-sky-100 to-indigo-100 text-indigo-700 shadow-sm shadow-sky-100'
					: 'border-slate-200 bg-white/90 text-slate-300 hover:border-sky-200 hover:bg-sky-50'
			}`}
		>
			{checked ? <span className="text-indigo-700">✓</span> : null}
		</button>
	);
};

export default HabitCheckbox;
