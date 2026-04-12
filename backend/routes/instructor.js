const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { analyzeUser } = require('../services/recommender');

const router = express.Router();

function ensureInstructorAccess(req, res) {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    res.status(403).send({ error: 'Access denied' });
    return false;
  }

  return true;
}

async function buildInstructorAnalytics() {
  const users = await User.find({ role: 'student' });
  const learnerRows = await Promise.all(
    users.map(async (user) => {
      const analysis = await analyzeUser(user._id);
      const weakestTopic = analysis.topicBreakdown[0];
      const riskLevel =
        analysis.overallMastery < 40 ? 'high' : analysis.overallMastery < 60 ? 'medium' : 'low';

      return {
        user_id: user._id.toString(),
        name: user.name,
        email: user.email,
        skill_level: user.skillLevel,
        activity_count: analysis.activityCount,
        overall_mastery: analysis.overallMastery,
        weak_topic: weakestTopic?.topic || 'No data yet',
        next_recommended_topic: analysis.nextRecommendedTopic,
        readiness_label: analysis.readinessLabel,
        risk_level: riskLevel,
        last_activity: analysis.lastActivityAt,
      };
    })
  );

  const activityCount = learnerRows.reduce((sum, row) => sum + row.activity_count, 0);
  const overallMastery = learnerRows.length
    ? Math.round(
        learnerRows.reduce((sum, row) => sum + row.overall_mastery, 0) / learnerRows.length
      )
    : 0;

  const weakTopicCount = new Map();
  learnerRows.forEach((row) => {
    if (row.weak_topic && row.weak_topic !== 'No data yet') {
      weakTopicCount.set(row.weak_topic, (weakTopicCount.get(row.weak_topic) || 0) + 1);
    }
  });

  const topWeakTopics = Array.from(weakTopicCount.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      learner_count: count,
      reason: `${count} learner${count === 1 ? '' : 's'} currently show this as the weakest topic.`,
    }));

  return {
    summary: {
      student_count: learnerRows.length,
      activity_count: activityCount,
      overall_mastery: overallMastery,
    },
    top_weak_topics: topWeakTopics,
    at_risk_learners: learnerRows
      .filter((row) => row.risk_level !== 'low')
      .sort((left, right) => left.overall_mastery - right.overall_mastery)
      .slice(0, 6),
    learner_rows: learnerRows.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

// Analytics
router.get('/analytics', auth, async (req, res) => {
  if (!ensureInstructorAccess(req, res)) {
    return;
  }

  try {
    const analytics = await buildInstructorAnalytics();
    res.send(analytics);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Export CSV
router.get('/analytics/export.csv', auth, async (req, res) => {
  if (!ensureInstructorAccess(req, res)) {
    return;
  }

  try {
    const analytics = await buildInstructorAnalytics();
    const headers = [
      'Name',
      'Email',
      'Skill Level',
      'Activities',
      'Overall Mastery',
      'Weak Topic',
      'Next Recommended Topic',
      'Risk Level',
      'Last Activity',
    ];

    const rows = analytics.learner_rows.map((row) => [
      row.name,
      row.email,
      row.skill_level,
      row.activity_count,
      row.overall_mastery,
      row.weak_topic,
      row.next_recommended_topic,
      row.risk_level,
      row.last_activity ? new Date(row.last_activity).toISOString() : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="instructor_analytics_report.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Seed demo data
router.post('/seed', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Access denied' });
  }

  try {
    const users = [
      { name: 'Demo Student 1', email: 'student1@example.com', password: 'password', skillLevel: 'beginner' },
      { name: 'Demo Student 2', email: 'student2@example.com', password: 'password', skillLevel: 'intermediate' }
    ];
    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 8);
      const user = new User({ ...u, password: hashed });
      await user.save();
      // Add some activities
      const activities = [
        { user: user._id, topic: 'Variables and Data Types', quizScore: 80, codingScore: 70, timeSpent: 15, completed: true },
        { user: user._id, topic: 'Loops', quizScore: 60, codingScore: 50, timeSpent: 25, completed: false }
      ];
      for (const a of activities) {
        const act = new Activity(a);
        await act.save();
      }
    }
    res.send({ message: 'Demo data seeded' });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
