import { useEffect, useMemo, useState } from 'react';
import { createHabit, getHabits, updateHabit } from '../services/habitService';

const getTodayDayNumber = () => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
};

const normalizeCompletions = (completions) => {
  if (!completions || typeof completions !== 'object') return {};

  if (completions instanceof Map) {
    return Object.fromEntries(completions.entries());
  }

  return Object.keys(completions).reduce((acc, key) => {
    acc[key] = Boolean(completions[key]);
    return acc;
  }, {});
};

const normalizeHabit = (habit) => ({
  _id: habit?._id,
  name: String(habit?.name || '').trim(),
  completions: normalizeCompletions(habit?.completions),
});

const useHabits = () => {
  const [habitItems, setHabitItems] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await getHabits();
        const normalized = Array.isArray(response) ? response.map(normalizeHabit) : [];
        setHabitItems(normalized.filter((item) => item.name));
      } catch (error) {
        console.error('Failed to fetch habits:', error);
      }
    };

    fetchHabits();
  }, []);

  const habits = useMemo(() => habitItems.map((item) => item.name), [habitItems]);

  const completed = useMemo(() => {
    return habitItems.reduce((acc, item) => {
      Object.entries(item.completions || {}).forEach(([dayKey, value]) => {
        acc[`${item.name}-${dayKey}`] = Boolean(value);
      });
      return acc;
    }, {});
  }, [habitItems]);

  const addHabit = async (habitName) => {
    const trimmedHabitName = String(habitName || '').trim();
    if (!trimmedHabitName) return;
    if (habitItems.some((item) => item.name === trimmedHabitName)) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticHabit = {
      _id: tempId,
      name: trimmedHabitName,
      completions: {},
    };

    setHabitItems((prevItems) => [...prevItems, optimisticHabit]);

    try {
      const created = await createHabit({ name: trimmedHabitName, completions: {} });
      const normalizedCreated = normalizeHabit(created);
      setHabitItems((prevItems) =>
        prevItems.map((item) => (item._id === tempId ? normalizedCreated : item))
      );
    } catch (error) {
      console.error('Failed to create habit:', error);
      setHabitItems((prevItems) => prevItems.filter((item) => item._id !== tempId));
    }
  };

  const toggleHabit = async (habitName, day = getTodayDayNumber()) => {
    const targetHabit = habitItems.find((item) => item.name === habitName);
    if (!targetHabit) return;

    const dayKey = String(day);
    const previousValue = Boolean(targetHabit.completions?.[dayKey]);
    const nextCompletions = {
      ...targetHabit.completions,
      [dayKey]: !previousValue,
    };

    setHabitItems((prevItems) =>
      prevItems.map((item) =>
        item.name === habitName
          ? {
              ...item,
              completions: nextCompletions,
            }
          : item
      )
    );

    if (!targetHabit._id || String(targetHabit._id).startsWith('temp-')) return;

    try {
      const updated = await updateHabit(targetHabit._id, { completions: nextCompletions });
      const normalizedUpdated = normalizeHabit(updated);

      setHabitItems((prevItems) =>
        prevItems.map((item) => (item._id === targetHabit._id ? normalizedUpdated : item))
      );
    } catch (error) {
      console.error('Failed to update habit completion:', error);
      setHabitItems((prevItems) =>
        prevItems.map((item) =>
          item.name === habitName
            ? {
                ...item,
                completions: {
                  ...item.completions,
                  [dayKey]: previousValue,
                },
              }
            : item
        )
      );
    }
  };

  return {
    habits,
    completed,
    addHabit,
    toggleHabit,
  };
};

export default useHabits;
