import { useState } from 'react';

const AddHabit = ({ addHabit }) => {
	const [habitName, setHabitName] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();

		const trimmedHabitName = habitName.trim();
		if (!trimmedHabitName) return;

		await addHabit(trimmedHabitName);
		setHabitName('');
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur"
		>
			<label
				htmlFor="habit-name"
				className="mb-3 block text-sm font-semibold uppercase tracking-[0.08em] text-slate-600"
			>
				Add New Study Item
			</label>

			<div className="flex flex-col gap-3 sm:flex-row">
				<input
					id="habit-name"
					type="text"
					value={habitName}
					onChange={(event) => setHabitName(event.target.value)}
					placeholder="e.g. Revise biology for 30 minutes"
					className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
				/>

				<button
					type="submit"
					className="h-12 rounded-2xl bg-linear-to-r from-sky-500 to-indigo-500 px-6 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:to-indigo-600 active:scale-[0.99]"
				>
					Add Study
				</button>
			</div>
		</form>
	);
};

export default AddHabit;
