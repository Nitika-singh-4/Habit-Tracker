const toSafeNumber = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeMonthKey = (currentMonth) => {
	if (typeof currentMonth === 'string' && /^\d{4}-\d{2}$/.test(currentMonth)) {
		return currentMonth;
	}

	const date = new Date(currentMonth || Date.now());
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
};

const getNextMonthKey = (monthKey) => {
	const [yearPart, monthPart] = monthKey.split('-').map(Number);
	const date = new Date(yearPart, monthPart - 1, 1);
	date.setMonth(date.getMonth() + 1);

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
};

const getTopicUniqueKey = (topic, index) => String(topic?.id || topic?.title || index);

export const carryForwardIncompleteTopics = (subjects = [], currentMonth) => {
	const monthKey = normalizeMonthKey(currentMonth);
	const nextMonthKey = getNextMonthKey(monthKey);
	const safeSubjects = Array.isArray(subjects) ? subjects : [];

	return safeSubjects.map((subject) => {
		const existingTracking =
			subject?.monthlyTracking && typeof subject.monthlyTracking === 'object'
				? subject.monthlyTracking
				: {};

		const currentMonthTopics = Array.isArray(existingTracking[monthKey])
			? existingTracking[monthKey]
			: Array.isArray(subject?.topics)
				? subject.topics
				: [];

		const completedThisMonth = currentMonthTopics.filter((topic) => topic?.completed);
		const incompleteThisMonth = currentMonthTopics.filter((topic) => !topic?.completed);

		const existingHistory = Array.isArray(subject?.completedTopicsHistory)
			? subject.completedTopicsHistory
			: [];

		const completedHistoryToAppend = completedThisMonth.map((topic) => ({
			...topic,
			carriedFromMonth: monthKey,
			historyRecordedAt: topic?.completedDate || new Date().toISOString().split('T')[0],
		}));

		const existingNextMonthTopics = Array.isArray(existingTracking[nextMonthKey])
			? existingTracking[nextMonthKey]
			: [];

		const carriedForwardTopics = incompleteThisMonth.map((topic, index) => ({
			...topic,
			id: topic?.id || `${subject?.id || 'subject'}-${nextMonthKey}-${index + 1}`,
			completed: false,
			completedDate: undefined,
		}));

		const mergedMap = new Map();

		existingNextMonthTopics.forEach((topic, index) => {
			mergedMap.set(getTopicUniqueKey(topic, index), {
				...topic,
				completed: Boolean(topic?.completed),
			});
		});

		carriedForwardTopics.forEach((topic, index) => {
			const key = getTopicUniqueKey(topic, index);
			if (!mergedMap.has(key)) {
				mergedMap.set(key, topic);
			}
		});

		const nextMonthTopics = Array.from(mergedMap.values());

		return {
			...subject,
			topics: nextMonthTopics,
			activeMonth: nextMonthKey,
			monthlyTracking: {
				...existingTracking,
				[monthKey]: currentMonthTopics,
				[nextMonthKey]: nextMonthTopics,
			},
			completedTopicsHistory: [...existingHistory, ...completedHistoryToAppend],
		};
	});
};

export const calculateMonthlyProgress = (subjects = []) => {
	const normalizedSubjects = Array.isArray(subjects) ? subjects : [];

	const subjectProgress = normalizedSubjects.map((subject) => {
		const topicList = Array.isArray(subject?.topics) ? subject.topics : [];
		const totalTopics = topicList.length;
		const completedTopics = topicList.reduce(
			(count, topic) => count + (topic?.completed ? 1 : 0),
			0
		);
		const remainingTopics = Math.max(totalTopics - completedTopics, 0);
		const completionPercentage = totalTopics
			? Math.round((completedTopics / totalTopics) * 100)
			: 0;

		return {
			id: String(subject?.id || ''),
			name: String(subject?.name || 'Unknown Subject'),
			monthlyGoal: toSafeNumber(subject?.monthlyGoal),
			totalTopics,
			completedTopics,
			remainingTopics,
			completionPercentage,
		};
	});

	const totals = subjectProgress.reduce(
		(acc, subject) => {
			acc.totalTopics += subject.totalTopics;
			acc.completedTopics += subject.completedTopics;
			acc.remainingTopics += subject.remainingTopics;
			acc.monthlyGoal += subject.monthlyGoal;
			return acc;
		},
		{
			totalTopics: 0,
			completedTopics: 0,
			remainingTopics: 0,
			monthlyGoal: 0,
		}
	);

	const overallCompletionPercentage = totals.totalTopics
		? Math.round((totals.completedTopics / totals.totalTopics) * 100)
		: 0;

	return {
		subjectProgress,
		totals: {
			...totals,
			overallCompletionPercentage,
		},
	};
};

export default calculateMonthlyProgress;
