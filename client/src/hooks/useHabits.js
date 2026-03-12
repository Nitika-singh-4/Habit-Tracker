import { useEffect, useMemo, useState } from 'react';
import { createHabit, getHabits, updateHabit } from '../services/habitService';

const DEFAULT_MONTHLY_GOAL = 20;

const getTodayDayNumber = () => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
};

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const formatTopicTitle = (key) => {
  if (isIsoDate(key)) {
    return `Study session ${key}`;
  }

  return `Day ${key} study`;
};

const normalizeCompletionEntry = (key, value) => {
  if (typeof value === 'boolean') {
    return {
      completed: value,
      completedDate: value && isIsoDate(key) ? key : undefined,
    };
  }

  if (value && typeof value === 'object') {
    const completed = Boolean(value.done ?? value.completed);
    const completedDate =
      typeof value.completedDate === 'string' && isIsoDate(value.completedDate)
        ? value.completedDate
        : completed && isIsoDate(key)
          ? key
          : undefined;

    return {
      completed,
      completedDate,
    };
  }

  const completed = Boolean(value);
  return {
    completed,
    completedDate: completed && isIsoDate(key) ? key : undefined,
  };
};

const normalizeCompletions = (completions) => {
  if (!completions || typeof completions !== 'object') return {};

  if (completions instanceof Map) {
    return Array.from(completions.entries()).reduce((acc, [rawKey, value]) => {
      const key = String(rawKey);
      acc[key] = normalizeCompletionEntry(key, value);
      return acc;
    }, {});
  }

  return Object.keys(completions).reduce((acc, key) => {
    acc[key] = normalizeCompletionEntry(key, completions[key]);
    return acc;
  }, {});
};

const habitToSubject = (habit) => {
  const completions = normalizeCompletions(habit?.completions);
  const topics = Object.entries(completions).map(([key, completionEntry]) => ({
    id: String(key),
    title: formatTopicTitle(key),
    completed: Boolean(completionEntry?.completed),
    completedDate: completionEntry?.completedDate,
  }));

  return {
    id: String(habit?._id || ''),
    name: String(habit?.name || '').trim(),
    monthlyGoal: DEFAULT_MONTHLY_GOAL,
    topics,
  };
};

const subjectsToStudyLog = (subjects) => {
  return subjects.reduce((log, subject) => {
    subject.topics.forEach((topic) => {
      if (!topic.completed) return;

      const dateKey = topic.completedDate;
      if (!dateKey || !isIsoDate(dateKey)) return;

      if (!log[dateKey]) {
        log[dateKey] = [];
      }

      if (!log[dateKey].includes(subject.name)) {
        log[dateKey].push(subject.name);
      }
    });

    return log;
  }, {});
};

const subjectToCompletions = (subject) => {
  return subject.topics.reduce((acc, topic) => {
    acc[topic.id] = {
      done: Boolean(topic.completed),
      completedDate:
        topic.completed && typeof topic.completedDate === 'string' && isIsoDate(topic.completedDate)
          ? topic.completedDate
          : undefined,
    };
    return acc;
  }, {});
};

const upsertTopicSnapshot = (topics, snapshot) => {
  const index = topics.findIndex((topic) => topic.id === snapshot.id);
  if (index === -1) {
    return [...topics, snapshot];
  }

  return topics.map((topic, topicIndex) => (topicIndex === index ? snapshot : topic));
};

const createTopicIdFromTitle = (title) =>
  String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `topic-${Date.now()}`;

const upsertTopicByKey = (topics, key, nextCompleted) => {
  const topicKey = String(key);
  const existingTopicIndex = topics.findIndex((topic) => topic.id === topicKey);
  const nextDate = nextCompleted ? (isIsoDate(topicKey) ? topicKey : getTodayIsoDate()) : undefined;

  if (existingTopicIndex === -1) {
    return [
      ...topics,
      {
        id: topicKey,
        title: formatTopicTitle(topicKey),
        completed: nextCompleted,
        completedDate: nextDate,
      },
    ];
  }

  return topics.map((topic, index) =>
    index === existingTopicIndex
      ? {
          ...topic,
          completed: nextCompleted,
          completedDate: nextDate,
        }
      : topic
  );
};

const useHabits = () => {
  const [subjects, setSubjects] = useState([]);
  const [studyLog, setStudyLog] = useState({});

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await getHabits();
        const normalizedSubjects = Array.isArray(response)
          ? response.map(habitToSubject).filter((subject) => subject.name)
          : [];

        setSubjects(normalizedSubjects);
        setStudyLog(subjectsToStudyLog(normalizedSubjects));
      } catch (error) {
        console.error('Failed to fetch habits:', error);
      }
    };

    fetchHabits();
  }, []);

  const habits = useMemo(() => subjects.map((subject) => subject.name), [subjects]);

  const completed = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      subject.topics.forEach((topic) => {
        acc[`${subject.name}-${topic.id}`] = Boolean(topic.completed);
      });
      return acc;
    }, {});
  }, [subjects]);

  const addHabit = async (habitName) => {
    const trimmedHabitName = String(habitName || '').trim();
    if (!trimmedHabitName) return;
    if (subjects.some((subject) => subject.name === trimmedHabitName)) return;

    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optimisticSubject = {
      id: tempId,
      name: trimmedHabitName,
      monthlyGoal: DEFAULT_MONTHLY_GOAL,
      topics: [],
    };

    setSubjects((prevSubjects) => [...prevSubjects, optimisticSubject]);

    try {
      const created = await createHabit({ name: trimmedHabitName, completions: {} });
      const normalizedCreated = habitToSubject(created);
      setSubjects((prevSubjects) =>
        prevSubjects.map((subject) => (subject.id === tempId ? normalizedCreated : subject))
      );
    } catch (error) {
      console.error('Failed to create habit:', error);
      setSubjects((prevSubjects) => prevSubjects.filter((subject) => subject.id !== tempId));
    }
  };

  const toggleHabit = async (habitName, day = getTodayDayNumber()) => {
    const targetSubject = subjects.find((subject) => subject.name === habitName);
    if (!targetSubject) return;

    const dayKey = String(day);
    const existingTopic = targetSubject.topics.find((topic) => topic.id === dayKey);
    const previousTopicSnapshot = existingTopic
      ? {
        ...existingTopic,
      }
      : {
        id: dayKey,
        title: formatTopicTitle(dayKey),
        completed: false,
        completedDate: undefined,
      };
    const previousValue = Boolean(existingTopic?.completed);
    const nextValue = !previousValue;
    const nextTopics = upsertTopicByKey(targetSubject.topics, dayKey, nextValue);

    setSubjects((prevSubjects) => {
      const nextSubjects = prevSubjects.map((subject) =>
        subject.name === habitName
          ? {
              ...subject,
              topics: nextTopics,
            }
          : subject
      );

      setStudyLog(subjectsToStudyLog(nextSubjects));
      return nextSubjects;
    });

    if (!targetSubject.id || String(targetSubject.id).startsWith('temp-')) return;

    try {
      const updated = await updateHabit(targetSubject.id, {
        completions: subjectToCompletions({ ...targetSubject, topics: nextTopics }),
      });
      const normalizedUpdated = habitToSubject(updated);

      setSubjects((prevSubjects) => {
        const nextSubjects = prevSubjects.map((subject) =>
          subject.id === targetSubject.id ? normalizedUpdated : subject
        );

        setStudyLog(subjectsToStudyLog(nextSubjects));
        return nextSubjects;
      });
    } catch (error) {
      console.error('Failed to update habit completion:', error);
      setSubjects((prevSubjects) => {
        const revertedSubjects = prevSubjects.map((subject) =>
          subject.name === habitName
            ? {
                ...subject,
                topics: upsertTopicSnapshot(subject.topics, previousTopicSnapshot),
              }
            : subject
        );

        setStudyLog(subjectsToStudyLog(revertedSubjects));
        return revertedSubjects;
      });
    }
  };

  const addTopic = async (subjectId, title) => {
    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) return;

    const targetSubject = subjects.find((subject) => subject.id === subjectId);
    if (!targetSubject) return;

    const topicId = createTopicIdFromTitle(trimmedTitle);
    if (targetSubject.topics.some((topic) => topic.id === topicId)) return;

    const nextTopics = [
      ...targetSubject.topics,
      {
        id: topicId,
        title: trimmedTitle,
        completed: false,
        completedDate: undefined,
      },
    ];

    setSubjects((prevSubjects) =>
      prevSubjects.map((subject) =>
        subject.id === subjectId
          ? {
            ...subject,
            topics: nextTopics,
          }
          : subject
      )
    );

    if (!targetSubject.id || String(targetSubject.id).startsWith('temp-')) return;

    try {
      await updateHabit(targetSubject.id, {
        completions: subjectToCompletions({ ...targetSubject, topics: nextTopics }),
      });
    } catch (error) {
      console.error('Failed to add topic:', error);
      setSubjects((prevSubjects) =>
        prevSubjects.map((subject) =>
          subject.id === subjectId
            ? {
              ...subject,
              topics: subject.topics.filter((topic) => topic.id !== topicId),
            }
            : subject
        )
      );
    }
  };

  const toggleTopicCompletion = async (subjectId, topicId) => {
    const targetSubject = subjects.find((subject) => subject.id === subjectId);
    if (!targetSubject) return;

    const topic = targetSubject.topics.find((item) => item.id === topicId);
    if (!topic) return;

    const nextCompleted = !topic.completed;
    const nextTopics = targetSubject.topics.map((item) =>
      item.id === topicId
        ? {
          ...item,
          completed: nextCompleted,
          completedDate: nextCompleted ? getTodayIsoDate() : undefined,
        }
        : item
    );

    setSubjects((prevSubjects) => {
      const nextSubjects = prevSubjects.map((subject) =>
        subject.id === subjectId
          ? {
            ...subject,
            topics: nextTopics,
          }
          : subject
      );

      setStudyLog(subjectsToStudyLog(nextSubjects));
      return nextSubjects;
    });

    if (!targetSubject.id || String(targetSubject.id).startsWith('temp-')) return;

    try {
      await updateHabit(targetSubject.id, {
        completions: subjectToCompletions({ ...targetSubject, topics: nextTopics }),
      });
    } catch (error) {
      console.error('Failed to toggle topic completion:', error);
      setSubjects((prevSubjects) => {
        const revertedSubjects = prevSubjects.map((subject) =>
          subject.id === subjectId
            ? {
              ...subject,
              topics: subject.topics.map((item) =>
                item.id === topicId
                  ? {
                    ...item,
                    completed: topic.completed,
                    completedDate: topic.completedDate,
                  }
                  : item
              ),
            }
            : subject
        );

        setStudyLog(subjectsToStudyLog(revertedSubjects));
        return revertedSubjects;
      });
    }
  };

  return {
    subjects,
    studyLog,
    habits,
    completed,
    addHabit,
    toggleHabit,
    addTopic,
    toggleTopicCompletion,
  };
};

export default useHabits;
