# AGENTS.md

## Purpose
This file helps AI coding agents understand the repository layout, conventions, and where to make safe changes.

## Project structure
- `backend/` contains the Node.js API, Express routes, Mongoose models, and recommendation logic.
- `frontend/` contains the Next.js 14 app router frontend, UI components, and client API wrappers.
- `README.md` is the main project documentation and should be referenced for architecture, route summaries, and setup instructions.

## When working on models
- Backend models are defined with Mongoose in `backend/models/*.js`.
- Existing model files:
  - `backend/models/User.js`
  - `backend/models/Activity.js`
  - `backend/models/Feedback.js`
  - `backend/models/ProgressSnapshot.js`
- Keep database logic in Mongoose schema definitions and use the existing `mongoose.model()` export pattern.
- Do not introduce a new ORM or database abstraction layer; use the existing MongoDB/Mongoose stack.
- If adding or changing model fields, update any dependent route handlers, services, and tests that use those fields.

## Key backend conventions
- Authentication and role checks are handled in `backend/middleware/auth.js`.
- API routes are organized under `backend/routes/`.
- Recommendation and analysis code lives in `backend/services/`.
- `backend/app.js` wires routes, middleware, and MongoDB connection.
- Use the backend package scripts:
  - `npm install` in `backend/`
  - `npm run dev` in `backend/`
  - `npm test` in `backend/`

## When the argument is models
- Focus on Mongoose schema shape, field validation, indexes, and relationships between `User`, `Activity`, `Feedback`, and `ProgressSnapshot`.
- Preserve the project’s existing naming and scoring conventions:
  - `User.role` is `student | instructor | admin`
  - `User.skillLevel` is `beginner | intermediate | advanced`
  - `Activity` records include `quizScore`, `codingScore`, `timeSpent`, `attempts`, `completed`, and `pointsEarned`
  - `ProgressSnapshot` records mastery and status for topics
- Ensure model changes support recommendation analysis in `backend/services/recommender.js` and route payload normalization in `backend/routes/activity.js`.

## Best practices for agents
- Prefer small, targeted changes with clear reasoning.
- When updating models, also update any fixtures, demo seeding, or tests if the change affects API behavior.
- Keep frontend and backend responsibilities separate: frontend should not implement database logic.
- Use `README.md` for broader behavior and route expectations instead of copying long explanations.
