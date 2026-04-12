const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Ingest activity
router.post('/ingest', auth, async (req, res) => {
  try {
    const pointsEarned = (req.body.quizScore || 0) + (req.body.codingScore || 0);
    const activity = new Activity({ ...req.body, user: req.user._id, pointsEarned });
    await activity.save();
    // Update user points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });
    res.status(201).send(activity);
  } catch (e) {
    res.status(400).send(e);
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
    res.status(500).send(e);
  }
});

// Get timeline
router.get('/timeline', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.send(activities);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ points: -1 }).limit(10).select('name points');
    res.send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;