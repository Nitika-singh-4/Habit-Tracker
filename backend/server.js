const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const habitRoutes = require('./routes/habitRoutes');
const goalRoutes = require('./routes/goalRoutes');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 5;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (_req, res) => {
	res.status(200).json({ message: 'Study tracker API is running.' });
});

app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);

app.use((error, _req, res, _next) => {
	console.error(error);
	res.status(500).json({ message: 'Internal server error.' });
});

const startListening = (startPort, retriesLeft) => {
	return new Promise((resolve, reject) => {
		const server = app.listen(startPort, () => {
			resolve({ server, port: startPort });
		});

		server.on('error', (error) => {
			if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
				const nextPort = startPort + 1;
				console.warn(
					`Port ${startPort} is in use. Retrying with port ${nextPort}...`
				);
				resolve(startListening(nextPort, retriesLeft - 1));
				return;
			}

			reject(error);
		});
	});
};

const startServer = async () => {
	try {
		await connectDB();
		const { port } = await startListening(PORT, MAX_PORT_RETRIES);
		console.log(`Server running on port ${port}`);
	} catch (error) {
		console.error('Failed to start server:', error.message);
		process.exit(1);
	}
};

startServer();
