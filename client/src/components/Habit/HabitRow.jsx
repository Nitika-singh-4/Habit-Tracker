import HabitCheckbox from './HabitCheckbox';

const HabitRow = ({ habitName, days, completedData, toggleHabit }) => {
	const visibleDays = Array.isArray(days) ? days.slice(0, 7) : [];

	return (
		<tr className="border-b border-slate-100/80 last:border-b-0 hover:bg-white/70">
			<td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">
				{habitName}
			</td>

			{visibleDays.map((day) => {
				const key = `${habitName}-${day.value}`;
				const isChecked = Boolean(completedData[key]);

				return (
					<td key={key} className="px-2 py-2 text-center">
						<HabitCheckbox
							checked={isChecked}
							onToggle={() => toggleHabit(habitName, day.value)}
							label={`${habitName} on ${day.value}`}
						/>
					</td>
				);
			})}
		</tr>
	);
};

export default HabitRow;
