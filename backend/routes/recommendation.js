const express = require('express');
const Feedback = require('../models/Feedback');
const { analyzeUser, getRecommendations } = require('../services/recommender');
const auth = require('../middleware/auth');

const router = express.Router();

// 🔍 Analyze user performance
router.get('/analyze', auth, async (req, res) => {
  try {
    const analysis = await analyzeUser(req.user._id);
    res.json(analysis);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🎯 Get recommended learning path
router.get('/path', auth, async (req, res) => {
  try {
    const analysis = await analyzeUser(req.user._id);
    const recommendations = getRecommendations(analysis);

    res.json({
      next_recommended_topic: analysis.nextRecommendedTopic,
      readiness_label: analysis.readinessLabel,
      overall_mastery: analysis.overallMastery,
      weak_topics: analysis.weakTopics || [],
      recommendations: recommendations || []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 💬 Submit feedback
router.post('/feedback', auth, async (req, res) => {
  try {
    const feedback = new Feedback({
      ...req.body,
      user: req.user._id
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
