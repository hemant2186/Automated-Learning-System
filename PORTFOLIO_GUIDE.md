# PathPilot AI Portfolio Guide

## One-line summary

PathPilot AI is a production-capable full-stack adaptive learning platform for novice programmers, built to convert learning activity into personalized study plans, instructor interventions, and cohort analytics.

## Why this is a 10/10 project

This project is more than a portfolio demo. It demonstrates:

- end-to-end product design across frontend, backend, and data layers
- role-based workflows for learners and instructors
- analytics-driven recommendations, not just static content
- secure authentication, refresh tokens, and stateful sessions
- exportable instructor reporting for real stakeholder value
- demo-ready seeded data and a production architecture

## Problem statement

Beginner programmers often do not know what to study next. They may spend too much time on the wrong concept, repeat mistakes without understanding them, or move ahead before their fundamentals are unstable. Instructors also struggle to identify weak learners early without manually checking every submission.

## Solution

I built a platform where:

- learners log quiz and coding performance, time spent, and practice attempts
- the backend converts that activity into mastery signals and readiness levels
- the system identifies weak topics and strengths automatically
- the app recommends the next topic to focus on with real study actions
- instructors get a cohort-level view of weak topics, risk levels, and exportable reports

## Real-world value

PathPilot AI can be used for:

- bootcamp or classroom training where instructors need early warning signals
- self-paced learning where users need a personalized next step after each session
- internal reskilling programs where teams need measurable progress and weak topic visibility
- MVPs for EdTech products that want a learning path engine and analytics layer

## Core features

- role-based student and instructor workflows with JWT auth
- automatic next-topic recommendation engine based on actual learner performance
- progress tracking with topic mastery, completion rates, and session history
- instructor analytics dashboard with top weak topics and at-risk learners
- exportable CSV reporting for stakeholders
- demo mode for instant evaluation without setup

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

The frontend handles user flows, data visualization, and API communication. It supports student and instructor dashboards, stores auth tokens in local storage, and refreshes access tokens automatically.

### Backend API layer

The backend handles authentication, activity ingestion, progress analysis, recommendation generation, instructor analytics, and demo data seeding. Routes are separated by concern in the `routes` folder.

### Data layer

MongoDB stores users, learner activity, and feedback. The data model supports multiple practice sessions per topic and enables cohort-level aggregation.

### Recommendation layer

The recommendation engine in `backend/services/recommender.js` reads learner activity and calculates mastery from quiz score, coding score, time spent, and practice attempts. It returns:

- overall mastery score
- topic-level strengths and weak points
- next recommended topic
- readiness label
- actionable study guidance and resource suggestions

## Resume-ready bullet

- Built PathPilot AI, a full-stack adaptive learning platform that converts learner activity into personalized recommendations and instructor analytics using Next.js, Node.js, Express, MongoDB, JWT, and role-based dashboards.

## Interview talking points

- I designed the system to solve real problems: learners need next-step guidance, instructors need early warning signals, and teams need exportable progress reports.
- The app uses learner activity as data, not just display; it computes mastery, weakness, and readiness and then transforms that into actionable study recommendations.
- I added secure authentication with JWT refresh tokens and demo sessions so the product could be evaluated instantly.
- Instructor analytics were built with real cohort-level outputs like top weak topics, risk labels, and CSV exports.

## Challenges I solved

- connecting frontend flows with backend auth and refresh token handling
- modeling learner progress with mastery, attempts, and time spent
- building a recommendation pipeline that maps activity into next-step guidance
- making the application usable for both students and instructors
- adding demo data to support fast product evaluation

## How to present it on a resume for high package roles

- focus on the product outcome, not just the tech stack
- describe it as an adaptive learning system with student and instructor workflows
- emphasize the analytics and recommendation engine as the core differentiator
- mention the secure API, JWT refresh flow, and exportable reporting

## Future improvements

- richer cohort analytics and time-series progress trends
- assignment, assessment, and practice scheduling modules
- stronger automated end-to-end testing
- deployment pipeline and continuous integration
