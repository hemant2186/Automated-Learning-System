const express = require('express');
const User = require('../models/User');
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
        risk_level: analysis.riskLevel,
        risk_factors: analysis.riskFactors,
        trend: analysis.trend,
        engagement_score: analysis.engagementScore,
        coverage_percent: analysis.coveragePercent,
        review_queue: analysis.reviewQueue,
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
      high_risk_count: learnerRows.filter((row) => row.risk_level === 'high').length,
      medium_risk_count: learnerRows.filter((row) => row.risk_level === 'medium').length,
      average_engagement: learnerRows.length
        ? Math.round(learnerRows.reduce((sum, row) => sum + row.engagement_score, 0) / learnerRows.length)
        : 0,
    },
    top_weak_topics: topWeakTopics,
    intervention_queue: learnerRows
      .filter((row) => row.risk_level !== 'low')
      .sort((left, right) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[left.risk_level] - riskOrder[right.risk_level] || left.overall_mastery - right.overall_mastery;
      })
      .slice(0, 8)
      .map((row) => ({
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        risk_level: row.risk_level,
        next_recommended_topic: row.next_recommended_topic,
        risk_factors: row.risk_factors,
        suggested_action:
          row.risk_level === 'high'
            ? 'Schedule a 1:1 remediation check-in and assign one focused practice pack.'
            : 'Send a targeted nudge with a short review task and check progress after the next session.',
      })),
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
    console.error('Instructor analytics error:', e);
    res.status(500).json({ error: 'Could not load instructor analytics.' });
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
    console.error('Instructor export error:', e);
    res.status(500).json({ error: 'Could not export instructor analytics.' });
  }
});

module.exports = router;
