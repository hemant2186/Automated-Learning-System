# PathPilot AI

PathPilot AI is an adaptive learning platform for beginner programmers. It turns lesson progress, quiz results, coding-exercise submissions, time spent, and repeated attempts into topic mastery signals, next-step recommendations, and instructor intervention queues. Students get a concrete place to continue learning; instructors get evidence about who needs support and why.

## What it does

- Learners register, sign in, manage goals, and work through published learning paths.
- Lesson pages deliver seeded Markdown content, examples, practice prompts, quizzes, and auto-graded coding exercises.
- Quiz and coding submissions are scored on the server and become real activity signals for recommendations.
- The backend calculates mastery, topic strengths, weaknesses, readiness, trends, review queues, and risk levels.
- Students see recommendations, topic progress, timelines, and leaderboard information.
- Instructors see cohort analytics, at-risk learners, weak-topic summaries, and CSV exports.

## Try it

Start both applications locally, then use the demo buttons on the homepage:

- `Student Demo`
- `Instructor Demo`

Demo sessions are idempotent. The student demo has a realistic multi-week history across several topics, including improvement and stale review data. The instructor demo includes a thriving learner, an at-risk learner, and a just-starting learner. Check the dashboard trend and review queue, then open the instructor analytics view to see the computed risk signals.

## Tech stack

### Frontend

- Next.js 14 App Router
- React 18
- Axios
- Bootstrap
- Recharts
- Lucide React
- React Markdown

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas or local MongoDB
- JWT authentication with access and refresh tokens
- bcryptjs
- Piston API for remote coding-exercise execution

## Local setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET` in `backend/.env`, then start the API:

```bash
npm run dev
```

Seed the published path, lessons, quizzes, and coding exercises:

```bash
npm run seed:content
```

Run the backend tests:

```bash
npm test
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The frontend uses `NEXT_PUBLIC_API_URL`, which defaults to `http://127.0.0.1:5000` in the API client.

## API routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/demo-session`

### Learning paths and lessons

- `GET /api/catalog`
- `GET /api/paths`
- `GET /api/paths/:slug`
- `GET /api/lessons/path/:pathSlug`
- `GET /api/lessons/:pathSlug/:lessonSlug`
- `GET /api/lessons/:slug` (legacy compatibility route)

### Quizzes and coding exercises

- `GET /api/quizzes/lesson/:lessonId`
- `POST /api/quizzes/:quizId/submit`
- `GET /api/quizzes/:lessonSlug` (legacy compatibility route)
- `POST /api/quizzes/:lessonSlug/submit` (legacy compatibility route)
- `GET /api/quizzes/:lessonSlug/results` (legacy compatibility route)
- `GET /api/code-exercises/lesson/:lessonId`
- `POST /api/code-exercises/:exerciseId/submit`

The older slug-based quiz and lesson routes remain available for compatibility. Quiz answers and coding-exercise hidden tests are never exposed before submission.

### Activity and recommendations

- `POST /api/activity/ingest`
- `GET /api/activity/progress`
- `GET /api/activity/timeline`
- `GET /api/activity/leaderboard`
- `GET /api/recommendations/analyze`
- `GET /api/recommendations/path`
- `POST /api/recommendations/feedback`

### Progress and instructor tools

- `GET /api/progress`
- `GET /api/progress/:slug`
- `POST /api/progress/:slug/enroll`
- `POST /api/progress/lessons/:lessonSlug/complete`
- `GET /api/instructor/analytics`
- `GET /api/instructor/analytics/export.csv`
- `POST /api/instructor/seed`

## Architecture notes

The Next.js frontend communicates with the Express API through `frontend/lib/api.js`. The Axios client attaches access tokens and refreshes them when necessary. Express routes are thin; controllers coordinate request/response behavior and services own reusable business logic. Mongoose models store users, curriculum content, attempts, submissions, and activity history in MongoDB. Recommendation and analysis code consumes those activity records without depending on frontend state.

## Project structure

```text
backend/
  app.js
  controllers/
  middleware/
  models/
  routes/
  services/
  scripts/
  test/
frontend/
  app/
  components/
  lib/
  services/
```
