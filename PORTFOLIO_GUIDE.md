# PathPilot AI Portfolio Guide

## One-line summary

PathPilot AI is a full-stack adaptive learning platform for novice programmers that turns learner activity into personalized next-step recommendations and instructor analytics.

## Problem statement

Beginner programmers often do not know what to study next. They may spend too much time on the wrong concept, repeat mistakes without understanding them, or move ahead before their fundamentals are stable. Instructors also struggle to identify weak learners early without manually checking every submission.

## Solution

I built a platform where:

- learners log quiz and coding performance
- the backend converts that activity into mastery signals
- the system identifies weak topics
- the app recommends the next topic to focus on
- instructors get a cohort-level view of weak topics and at-risk learners

## Core features

- JWT-based authentication
- learner dashboard with recommendations and progress
- activity ingestion and timeline tracking
- recommendation engine with topic-level mastery analysis
- profile management with saved learning preferences
- instructor analytics dashboard with CSV export
- built-in demo student and instructor sessions

## Tech stack

### Frontend

- Next.js 14
- React
- Axios
- Bootstrap
- Recharts

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs

## Architecture explanation

### Frontend layer

The frontend is responsible for user interaction. It provides learner and instructor pages, stores auth tokens locally, calls backend APIs through a shared Axios client, and presents results in a dashboard-style UI.

### Backend API layer

The backend handles authentication, activity ingestion, progress retrieval, recommendations, and instructor analytics. Each route is separated by domain in the `routes` folder.

### Data layer

MongoDB stores users, activities, feedback, and progress-related documents. Mongoose models define the data shape and make it easier to query and update learner records.

### Recommendation layer

The recommendation engine reads learner activity, calculates topic mastery based on quiz score, coding score, time spent, and attempts, then returns:

- overall mastery
- weak topics
- strengths
- readiness level
- next recommended topic

## My contribution highlights

- repaired the backend MongoDB connection flow
- rebuilt broken frontend-to-backend API integration
- added a missing recommendation service
- created a real learner workflow with activity logging
- implemented instructor analytics compatible with the frontend
- added profile persistence to MongoDB
- added demo sessions to make product evaluation easier
- cleaned the repo and updated docs
- added backend automated tests and deployment configuration

## What makes this project interesting

- It solves a real beginner-learning problem instead of being just a CRUD app.
- It shows full-stack integration between UI, API, and database.
- It includes role-based product design for students and instructors.
- It demonstrates analysis and recommendation logic, not just data storage.

## How to explain it in an interview

You can say:

> I built a full-stack edtech platform called PathPilot AI for novice programmers. The idea was to capture learner activity such as quiz scores, coding scores, and attempts, then use that data to estimate topic mastery and recommend the best next topic to study. The frontend was built in Next.js, the backend in Express, and data was stored in MongoDB Atlas. I also added an instructor dashboard to surface weak topics and at-risk learners across a cohort.

## Challenges I solved

- fixing broken API contracts between frontend and backend
- working around MongoDB SRV DNS resolution issues by switching to a non-SRV URI
- restoring a missing recommendation service
- aligning instructor analytics data with the frontend’s expectations
- making the app easier to demo by adding seeded demo sessions

## Future improvements

- richer analytics and charts
- notification system
- assignment and assessment modules
- stronger automated end-to-end testing
- deployment pipeline and CI integration
