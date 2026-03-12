# Habit Tracker

Full-stack Study Tracker app.

Frontend: React + Vite
Backend: Node.js + Express + MongoDB Atlas

## Local Run

1. Start backend from backend folder.
2. Start frontend from client folder.

## Deployment (Recommended)

Use this split deployment:

1. Backend on Render
2. Frontend on Vercel

### 1) Deploy Backend on Render

1. Push this repository to GitHub.
2. Open Render and create a new Web Service from your GitHub repository.
3. Use these settings:
	- Root Directory: backend
	- Build Command: npm install
	- Start Command: npm start
4. Set environment variables in Render:
	- MONGO_URI = your MongoDB Atlas connection string
	- CLIENT_URL = your frontend production URL (set after frontend deploy)
	- PORT = 10000 (optional; Render also provides PORT automatically)
5. Deploy and copy your backend URL, for example:
	- https://habit-tracker-api.onrender.com

### 2) Deploy Frontend on Vercel

1. Open Vercel and import this repository.
2. Configure project settings:
	- Root Directory: client
	- Framework Preset: Vite
	- Build Command: npm run build
	- Output Directory: dist
3. Add environment variable in Vercel:
	- VITE_API_BASE_URL = your Render backend URL
4. Deploy and copy your frontend URL.

### 3) Final CORS Step

After frontend deployment, go back to Render and update:

- CLIENT_URL = your exact Vercel frontend URL

Redeploy backend once after updating CLIENT_URL.

## Deployment Files

Backend blueprint file:
- [render.yaml](render.yaml)

Frontend Vercel file:
- [client/vercel.json](client/vercel.json)