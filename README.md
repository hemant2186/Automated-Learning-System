# PathPilot AI

PathPilot AI is a full-stack learning platform for novice programmers. Students log learning activity such as quiz scores, coding scores, time spent, and attempts. The system uses that data to estimate mastery, detect weak topics, recommend the next topic to learn, and surface instructor analytics for cohort support.

## What the project does

- Learners can register, sign in, and manage a profile.
- Learners can log study sessions topic by topic.
- The backend analyzes activity and computes:
  - overall mastery
  - weak topics
  - strengths
  - next recommended topic
- The learner dashboard shows recommendations, progress, a timeline, and leaderboard data.
- The instructor dashboard shows cohort mastery, top weak topics, at-risk learners, and CSV export.
- Demo student and instructor sessions are built in for quick product walkthroughs.

## Tech stack

### Frontend

- Next.js 14
- React 18
- Axios
- Bootstrap
- Recharts
- Lucide React

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas or local MongoDB
- JWT authentication
- bcryptjs

## Project structure

```text
learning-path-system/
├── backend/
│   ├── app.js
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── .env.example
└── README.md
```

## Main backend routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/demo-session`

### Activity

- `POST /api/activity/ingest`
- `GET /api/activity/progress`
- `GET /api/activity/timeline`
- `GET /api/activity/leaderboard`

### Recommendations

- `GET /api/recommendations/analyze`
- `GET /api/recommendations/path`
- `POST /api/recommendations/feedback`

### Instructor

- `GET /api/instructor/analytics`
- `GET /api/instructor/analytics/export.csv`
- `POST /api/instructor/seed`

## How frontend and backend connect

The frontend API layer is in `frontend/lib/api.js`.

- It uses `NEXT_PUBLIC_API_URL` to point to the backend.
- It attaches the access token automatically on protected requests.
- It refreshes access tokens with the refresh token when needed.

The backend exposes REST APIs and reads or writes learner data in MongoDB. Recommendation logic lives in `backend/services/recommender.js`.

## Local setup

### 1. Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env` with your MongoDB connection string and JWT secret.

Start the backend:

```bash
npm run dev
```

Run backend tests:

```bash
npm test
```

### 2. Frontend setup

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:5000`

## Demo access

You can start directly from the homepage with:

- `Student Demo`
- `Instructor Demo`

These buttons create demo sessions and seed demo data when needed.

## Beginner-friendly explanation

Think of the system like this:

1. A learner studies a topic and records how it went.
2. The backend saves that activity in MongoDB.
3. The recommendation service calculates how strong or weak the learner is in each topic.
4. The frontend dashboard asks the backend for that analysis.
5. The dashboard then shows what the learner should work on next.

So the project is not just a login app or just a dashboard. It is a small adaptive learning product.

## Recommended deployment

### Frontend

- Vercel

Environment variable:

- `NEXT_PUBLIC_API_URL=https://your-backend-url`

Set the Vercel project root to `frontend`.

### Backend

- Render, Railway, or Fly.io

Environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`

For Render, a starter blueprint is included in [render.yaml](c:/Users/Dell/Desktop/learning-path-system/render.yaml).

## Portfolio explanation

For a beginner-friendly project explanation or interview summary, see [PORTFOLIO_GUIDE.md](c:/Users/Dell/Desktop/learning-path-system/PORTFOLIO_GUIDE.md).

## Verification status

The current codebase has been verified for:

- backend startup and MongoDB connection
- frontend production build
- live register/login flow
- protected learner endpoints
- activity ingestion
- recommendation and analysis responses

## Next improvement ideas

- stronger automated API tests
- admin-only management tools
- richer analytics visualizations
- email/password reset flow
- deployment manifests for one-click hosting
