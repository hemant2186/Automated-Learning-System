# PathPilot AI

PathPilot AI is a full-stack adaptive learning platform that turns learner activity into real, actionable progress for students and instructors. It is built to solve real-world learning problems by tracking practice sessions, identifying weak topics, recommending the best next topic, and helping instructors intervene early.

## Why this project matters

Many education products only show dashboards. PathPilot AI goes further by using learner behavior to answer these real needs:

- students need a clear next step after each study session
- instructors need a fast way to identify struggling learners
- learning teams need evidence-based coaching signals, not guesswork
- bootcamps and self-paced platforms need to convert practice data into measurable mastery

## Real-world use cases

- Bootcamp instructors can monitor cohort progress, spot weak topics, and export progress reports for remediation.
- Self-paced learners can log each session and receive the next recommended topic based on actual performance.
- Training teams can use the platform as a lightweight skill-assessment tool for onboarding or internal reskilling.
- EdTech MVPs can adopt this architecture to build product features around learner analytics, recommendations, and personalized study plans.

## What the project does

- Learners can register, sign in, update their profile, and manage learning goals.
- Learners can log study sessions with quiz score, coding score, time spent, attempts, completion status, and feedback.
- The backend calculates mastery, topic strength, weaknesses, readiness levels, and the next best topic.
- Learners see a dashboard with recommendations, topic progress, activity timelines, and leaderboard motivation.
- Instructors see cohort-level analytics, at-risk learners, weak topic summaries, and CSV export for stakeholder reporting.
- Demo sessions allow product evaluation without requiring a full signup.

## What makes this employer-ready

- Full-stack implementation with a modern Next.js frontend and Express/MongoDB backend.
- Secure role-based authentication with JWT access and refresh tokens.
- Real recommendation logic based on scores, time, and attempts rather than a static checklist.
- Instructor-facing analytics built to support real intervention workflows.
- Clear frontend/backend separation and API-first design.
- Demo mode and seeded data, making the app instantly usable for evaluation.

## Resume-ready summary

- Built PathPilot AI, a full-stack adaptive learning system for novice programmers with role-based dashboards, personalized recommendations, and instructor analytics.
- Implemented secure JWT authentication, MongoDB persistence, analytics endpoints, and a recommendation engine that converts activity data into actionable next-study guidance.
- Designed the product to support bootcamp-style cohort monitoring, student remediation, and data-driven learning plans.

## Main backend routes

### Auth

- `POST /api/auth/register` — user sign-up with role, goals, and skill level
- `POST /api/auth/login` — secure login with bcrypt password verification
- `GET /api/auth/me` — current user profile and role
- `PUT /api/auth/me` — update profile, goals, and preferences
- `POST /api/auth/refresh` — refresh JWT access tokens automatically
- `POST /api/auth/demo-session` — create demo student or instructor sessions instantly

### Activity

- `POST /api/activity/ingest` — log hands-on learning activity for a topic
- `GET /api/activity/progress` — fetch topic-by-topic progress and mastery signals
- `GET /api/activity/timeline` — retrieve recent learner activity events
- `GET /api/activity/leaderboard` — show top-performing learners and engagement

### Recommendations

- `GET /api/recommendations/analyze` — compute mastery, strengths, weaknesses, and readiness
- `GET /api/recommendations/path` — return actionable next-topic recommendations
- `POST /api/recommendations/feedback` — store learner feedback for improved future iterations

### Instructor

- `GET /api/instructor/analytics` — cohort analytics with weak topics and risk levels
- `GET /api/instructor/analytics/export.csv` — export reports easily for stakeholders
- `POST /api/instructor/seed` — seed demo cohort data for instructor preview

## How frontend and backend connect

The frontend API layer is in `frontend/lib/api.js`.

- It uses `NEXT_PUBLIC_API_URL` to point to the backend.
- It attaches the access token automatically on protected requests.
- It refreshes access tokens with the refresh token when needed.
- It supports instructor and student flows through the same API layer.

The backend exposes REST APIs and stores learner data in MongoDB. Recommendation logic is implemented in `backend/services/recommender.js`, which returns not only weak topics but also next-step study actions and resources.

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

These buttons create demo sessions and seed demo data for quick evaluation.

## Real-world product value

This project is not just a showcase of technologies — it is a functional product for:

- guiding learners through a sequence of study topics based on performance
- surfacing weak concepts before learners fall behind
- giving instructors transparent, exportable reports for cohort interventions
- turning raw activity data into a usable learning path

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
