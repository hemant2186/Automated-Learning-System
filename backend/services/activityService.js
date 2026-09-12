const Activity = require('../models/Activity');
const User = require('../models/User');
const { TOPICS } = require('./analysis');

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function recordActivity({ userId, topic, quizScore = 0, codingScore = 0, timeSpent = 0, attempts = 1, completed = false, feedback = '' }) {
  const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
  if (!normalizedTopic || !TOPICS.includes(normalizedTopic)) {
    const error = new Error('Topic must be one of the supported learning path topics.');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    user: userId,
    topic: normalizedTopic,
    quizScore: clamp(toNumber(quizScore), 0, 100),
    codingScore: clamp(toNumber(codingScore), 0, 100),
    timeSpent: clamp(toNumber(timeSpent), 0, 480),
    attempts: Math.round(clamp(toNumber(attempts, 1), 1, 25)),
    completed: Boolean(completed),
    feedback: typeof feedback === 'string' ? feedback.trim().slice(0, 1000) : '',
  };
  const pointsEarned = Math.round((payload.quizScore + payload.codingScore) / 2) + (payload.completed ? 10 : 0);
  const activity = new Activity({ ...payload, pointsEarned });
  await activity.save();
  await User.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });
  return activity;
}

module.exports = { recordActivity };