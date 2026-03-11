import axios from 'axios';

const HABITS_API_URL = 'http://localhost:5000/api/habits';
const GOALS_API_URL = 'http://localhost:5000/api/goals';

export const getHabits = async () => {
	const response = await axios.get(HABITS_API_URL);
	return response.data;
};

export const createHabit = async (habitData) => {
	const response = await axios.post(HABITS_API_URL, habitData);
	return response.data;
};

export const updateHabit = async (id, updates) => {
	const response = await axios.put(`${HABITS_API_URL}/${id}`, updates);
	return response.data;
};

export const deleteHabit = async (id) => {
	const response = await axios.delete(`${HABITS_API_URL}/${id}`);
	return response.data;
};

export const getGoals = async () => {
	const response = await axios.get(GOALS_API_URL);
	return response.data;
};

export const updateGoals = async (payload) => {
	const response = await axios.put(GOALS_API_URL, payload);
	return response.data;
};

const habitService = {
	getHabits,
	createHabit,
	updateHabit,
	deleteHabit,
	getGoals,
	updateGoals,
};

export default habitService;
