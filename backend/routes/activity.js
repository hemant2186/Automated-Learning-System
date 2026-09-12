const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { TOPICS } = require('../services/analysis');
const { recordActivity } = require('../services/activityService');

const router = express.Router();

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeActivityPayload(payload) {
  const topic = typeof payload.topic === 'string' ? payload.topic.trim() : '';

  if (!topic) {
    return { error: 'Topic is required.' };
  }

  if (!TOPICS.includes(topic)) {
    return { error: 'Topic must be one of the supported learning path topics.' };
  }

  const quizScore = clamp(toNumber(payload.quizScore), 0, 100);
  const codingScore = clamp(toNumber(payload.codingScore), 0, 100);
  const timeSpent = clamp(toNumber(payload.timeSpent), 0, 480);
  const attempts = Math.round(clamp(toNumber(payload.attempts, 1), 1, 25));
  const feedback = typeof payload.feedback === 'string' ? payload.feedback.trim().slice(0, 1000) : '';

  return {
    topic,
    quizScore,
    codingScore,
    timeSpent,
    attempts,
    completed: Boolean(payload.completed),
    feedback,
  };
}

// Ingest activity
router.post('/ingest', auth, async (req, res) => {
  try {
    const payload = normalizeActivityPayload(req.body);
    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    const activity = await recordActivity({ userId: req.user._id, ...payload });
    res.status(201).send(activity);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Could not save activity.' });
  }
});

// Get progress
router.get('/progress', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id });
    // Calculate progress
    const progress = {};
    activities.forEach(act => {
      if (!progress[act.topic]) {
        progress[act.topic] = { total: 0, completed: 0, avgScore: 0, count: 0 };
      }
      progress[act.topic].total++;
      if (act.completed) progress[act.topic].completed++;
      const score = (act.quizScore + act.codingScore) / 2 || 0;
      progress[act.topic].avgScore = (progress[act.topic].avgScore * progress[act.topic].count + score) / (progress[act.topic].count + 1);
      progress[act.topic].count++;
    });
    res.send(progress);
  } catch (e) {
    console.error('Activity progress error:', e);
    res.status(500).json({ error: 'Could not load activity progress.' });
  }
});

// Get timeline
router.get('/timeline', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.send(activities);
  } catch (e) {
    console.error('Activity timeline error:', e);
    res.status(500).json({ error: 'Could not load activity timeline.' });
  }
});

// Leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ points: -1 }).limit(10).select('name points');
    res.send(users);
  } catch (e) {
    console.error('Activity leaderboard error:', e);
    res.status(500).json({ error: 'Could not load activity leaderboard.' });
  }
});

module.exports = router;
