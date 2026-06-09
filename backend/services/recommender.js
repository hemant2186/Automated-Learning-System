const Activity = require('../models/Activity');
const User = require('../models/User');
const { TOPICS, calculateMastery, getStatus } = require('./analysis');

const RESOURCE_LIBRARY = {
  'Computer Basics': {
    action: 'Review file navigation, terminals, editors, and program execution basics.',
    resource: 'Walk through a short setup checklist and run 3 tiny programs end-to-end.',
    successCriteria: 'Run a saved program from the terminal and explain each setup step.',
  },
  'Variables and Data Types': {
    action: 'Practice assigning values, converting types, and tracing how data changes.',
    resource: 'Build a mini score tracker using strings, numbers, and booleans.',
    successCriteria: 'Convert inputs safely and predict the type of each value before running code.',
  },
  Operators: {
    action: 'Compare arithmetic, comparison, and logical operators with quick drills.',
    resource: 'Solve five conditional exercises and explain each result in plain language.',
    successCriteria: 'Use comparison and boolean operators correctly in three edge-case checks.',
  },
  'Control Structures': {
    action: 'Use `if`, `else if`, and `else` to express decisions clearly.',
    resource: 'Create a grade classifier and test it with edge-case inputs.',
    successCriteria: 'Write a branching program that handles normal, boundary, and invalid inputs.',
  },
  Loops: {
    action: 'Focus on loop tracing, counters, and stopping conditions.',
    resource: 'Complete a loop worksheet, then code a repetition challenge from scratch.',
    successCriteria: 'Trace a loop by hand and fix one off-by-one or infinite-loop bug.',
  },
  Functions: {
    action: 'Break larger tasks into named, reusable chunks with parameters and return values.',
    resource: 'Refactor one long script into three smaller helper functions.',
    successCriteria: 'Create reusable functions with clear inputs, outputs, and one responsibility.',
  },
  Arrays: {
    action: 'Practice indexing, iteration, and simple transformations with lists.',
    resource: 'Build a to-do list or shopping list program with add/remove flows.',
    successCriteria: 'Read, update, filter, and summarize a list without losing items.',
  },
  Objects: {
    action: 'Organize related values using keys and nested data.',
    resource: 'Model a student profile object and print a formatted summary.',
    successCriteria: 'Represent a real entity with nested fields and safely access missing values.',
  },
  Classes: {
    action: 'Introduce object-oriented ideas only after functions and objects feel steady.',
    resource: 'Create a simple `StudentProgress` class with a couple of methods.',
    successCriteria: 'Create instances, update state through methods, and explain why the class exists.',
  },
  'Web Development Basics': {
    action: 'Bridge into routes, APIs, and data flow between frontend and backend.',
    resource: 'Connect a small form to an API endpoint and store the submitted data.',
    successCriteria: 'Submit data from a UI, persist it, and render the updated response.',
  },
};

function round(value) {
  return Math.round((value || 0) * 10) / 10;
}

function buildEmptyAnalysis(user) {
  const starterTopic = user?.skillLevel === 'advanced'
    ? 'Objects'
    : user?.skillLevel === 'intermediate'
      ? 'Functions'
      : 'Computer Basics';

  return {
    user: user
      ? {
          id: user._id.toString(),
          name: user.name,
          role: user.role,
          skillLevel: user.skillLevel,
        }
      : null,
    overallMastery: 0,
    readinessLabel: 'just-starting',
    nextRecommendedTopic: starterTopic,
    weakTopics: [],
    strengths: [],
    topicBreakdown: [],
    activityCount: 0,
    completedCount: 0,
    averageAttempts: 0,
    lastActivityAt: null,
    coveragePercent: 0,
    engagementScore: 0,
    trend: 'no-data',
    riskLevel: 'medium',
    riskFactors: ['No activity has been logged yet.'],
    reviewQueue: [],
  };
}

function daysBetween(date, now = new Date()) {
  if (!date) return null;
  return Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function buildReviewQueue(topicBreakdown) {
  const now = new Date();
  return topicBreakdown
    .map((topic) => {
      const daysSincePractice = daysBetween(topic.lastPracticed, now);
      const isWeak = topic.mastery < 65;
      const isStale = daysSincePractice !== null && daysSincePractice >= 7;

      if (!isWeak && !isStale) {
        return null;
      }

      return {
        topic: topic.topic,
        priority: topic.mastery < 50 ? 'high' : isStale ? 'medium' : 'normal',
        mastery: topic.mastery,
        daysSincePractice,
        reason:
          topic.mastery < 50
            ? 'Mastery is below the intervention threshold.'
            : isStale
              ? 'This topic has not been practiced recently.'
              : 'This topic still needs reinforcement.',
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const priorityOrder = { high: 0, medium: 1, normal: 2 };
      return priorityOrder[left.priority] - priorityOrder[right.priority] || left.mastery - right.mastery;
    })
    .slice(0, 5);
}

function calculateTrend(activities) {
  if (activities.length < 4) {
    return 'insufficient-data';
  }

  const midpoint = Math.floor(activities.length / 2);
  const firstHalf = activities.slice(0, midpoint);
  const secondHalf = activities.slice(midpoint);

  const averageMastery = (items) => round(
    items.reduce(
      (sum, activity) => sum + calculateMastery(
        activity.quizScore,
        activity.codingScore,
        activity.timeSpent,
        activity.attempts || 1
      ),
      0
    ) / items.length
  );

  const delta = averageMastery(secondHalf) - averageMastery(firstHalf);
  if (delta >= 8) return 'improving';
  if (delta <= -8) return 'declining';
  return 'steady';
}

function buildRiskSignals({ overallMastery, averageAttempts, completedCount, activities, reviewQueue }) {
  const riskFactors = [];
  const completionRate = activities.length ? (completedCount / activities.length) * 100 : 0;
  const daysSinceLastActivity = daysBetween(activities[activities.length - 1]?.createdAt);

  if (overallMastery < 45) {
    riskFactors.push('Overall mastery is below 45%.');
  }

  if (averageAttempts >= 3) {
    riskFactors.push('Average attempts are high, which suggests repeated friction.');
  }

  if (completionRate < 50) {
    riskFactors.push('Less than half of recent learning activities are completed.');
  }

  if (daysSinceLastActivity !== null && daysSinceLastActivity >= 7) {
    riskFactors.push('No learning activity has been logged in the last 7 days.');
  }

  if (reviewQueue.some((item) => item.priority === 'high')) {
    riskFactors.push('At least one topic is below the intervention threshold.');
  }

  const riskLevel = riskFactors.length >= 3 || overallMastery < 35
    ? 'high'
    : riskFactors.length >= 1 || overallMastery < 60
      ? 'medium'
      : 'low';

  return {
    riskLevel,
    riskFactors,
    daysSinceLastActivity,
    completionRate: round(completionRate),
  };
}

async function analyzeUser(userId) {
  const [user, activities] = await Promise.all([
    User.findById(userId),
    Activity.find({ user: userId }).sort({ createdAt: 1 }),
  ]);

  if (!user || activities.length === 0) {
    return buildEmptyAnalysis(user);
  }

  const topicMap = new Map();

  for (const activity of activities) {
    const mastery = calculateMastery(
      activity.quizScore,
      activity.codingScore,
      activity.timeSpent,
      activity.attempts || 1
    );

    if (!topicMap.has(activity.topic)) {
      topicMap.set(activity.topic, {
        topic: activity.topic,
        masteryTotal: 0,
        quizTotal: 0,
        codingTotal: 0,
        timeTotal: 0,
        attemptsTotal: 0,
        completedCount: 0,
        sessions: 0,
        lastPracticed: activity.createdAt,
      });
    }

    const entry = topicMap.get(activity.topic);
    entry.masteryTotal += mastery;
    entry.quizTotal += activity.quizScore || 0;
    entry.codingTotal += activity.codingScore || 0;
    entry.timeTotal += activity.timeSpent || 0;
    entry.attemptsTotal += activity.attempts || 1;
    entry.completedCount += activity.completed ? 1 : 0;
    entry.sessions += 1;
    entry.lastPracticed = activity.createdAt;
  }

  const topicBreakdown = Array.from(topicMap.values())
    .map((entry) => {
      const mastery = round(entry.masteryTotal / entry.sessions);
      return {
        topic: entry.topic,
        mastery,
        status: getStatus(mastery),
        averageQuizScore: round(entry.quizTotal / entry.sessions),
        averageCodingScore: round(entry.codingTotal / entry.sessions),
        averageTimeSpent: round(entry.timeTotal / entry.sessions),
        averageAttempts: round(entry.attemptsTotal / entry.sessions),
        completionRate: round((entry.completedCount / entry.sessions) * 100),
        sessions: entry.sessions,
        lastPracticed: entry.lastPracticed,
      };
    })
    .sort((left, right) => left.mastery - right.mastery);

  const overallMastery = round(
    topicBreakdown.reduce((sum, topic) => sum + topic.mastery, 0) / topicBreakdown.length
  );

  const weakTopics = topicBreakdown
    .filter((topic) => topic.status !== 'strong')
    .map((topic) => topic.topic);

  const strengths = topicBreakdown
    .filter((topic) => topic.status === 'strong')
    .map((topic) => topic.topic);

  const averageAttempts = round(
    activities.reduce((sum, activity) => sum + (activity.attempts || 1), 0) / activities.length
  );
  const reviewQueue = buildReviewQueue(topicBreakdown);
  const riskSignals = buildRiskSignals({
    overallMastery,
    averageAttempts,
    completedCount: activities.filter((activity) => activity.completed).length,
    activities,
    reviewQueue,
  });

  const nextRecommendedTopic =
    reviewQueue[0]?.topic ||
    topicBreakdown.find((topic) => topic.status !== 'strong')?.topic ||
    TOPICS.find((topic) => !topicMap.has(topic)) ||
    topicBreakdown[topicBreakdown.length - 1]?.topic ||
    TOPICS[0];

  const readinessLabel =
    overallMastery >= 80 ? 'project-ready' : overallMastery >= 55 ? 'building-confidence' : 'needs-support';

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      skillLevel: user.skillLevel,
    },
    overallMastery,
    readinessLabel,
    nextRecommendedTopic,
    weakTopics,
    strengths,
    topicBreakdown,
    activityCount: activities.length,
    completedCount: activities.filter((activity) => activity.completed).length,
    averageAttempts,
    lastActivityAt: activities[activities.length - 1].createdAt,
    coveragePercent: round((topicMap.size / TOPICS.length) * 100),
    engagementScore: round(
      Math.min(100, (activities.length * 8) + (riskSignals.completionRate * 0.4) + (overallMastery * 0.35))
    ),
    trend: calculateTrend(activities),
    riskLevel: riskSignals.riskLevel,
    riskFactors: riskSignals.riskFactors,
    daysSinceLastActivity: riskSignals.daysSinceLastActivity,
    completionRate: riskSignals.completionRate,
    reviewQueue,
  };
}

function estimateMinutes(topic) {
  if (!topic) return 30;
  if (topic.mastery < 50) return 45;
  if (topic.averageAttempts >= 3) return 40;
  return 25;
}

function getRecommendations(analysis) {
  if (!analysis.activityCount) {
    return [
      {
        topic: analysis.nextRecommendedTopic,
        level: 'starter',
        reason: 'No practice history yet, so the best next step is to begin with a confidence-building foundation.',
        action: RESOURCE_LIBRARY[analysis.nextRecommendedTopic]?.action || 'Start with a short beginner module.',
        resource: RESOURCE_LIBRARY[analysis.nextRecommendedTopic]?.resource || 'Complete one guided lesson and one tiny coding exercise.',
        successCriteria: RESOURCE_LIBRARY[analysis.nextRecommendedTopic]?.successCriteria || 'Finish one small exercise and explain the result.',
        estimatedMinutes: 30,
      },
      {
        topic: 'Variables and Data Types',
        level: 'starter',
        reason: 'Early familiarity with values and types makes every later topic less confusing.',
        action: RESOURCE_LIBRARY['Variables and Data Types'].action,
        resource: RESOURCE_LIBRARY['Variables and Data Types'].resource,
        successCriteria: RESOURCE_LIBRARY['Variables and Data Types'].successCriteria,
        estimatedMinutes: 30,
      },
    ];
  }

  const priorityTopics = analysis.reviewQueue?.length
    ? analysis.reviewQueue.map((item) => analysis.topicBreakdown.find((topic) => topic.topic === item.topic)).filter(Boolean)
    : analysis.topicBreakdown.filter((topic) => topic.status !== 'strong');

  return priorityTopics
    .filter((topic) => topic.status !== 'strong')
    .slice(0, 3)
    .map((topic, index) => {
      const libraryEntry = RESOURCE_LIBRARY[topic.topic] || {};
      return {
        topic: topic.topic,
        level: index === 0 ? 'priority' : 'support',
        reason:
          topic.mastery < 50
            ? `Mastery is ${topic.mastery}%, so this topic is still blocking confidence and forward progress.`
            : `Mastery is ${topic.mastery}%, which suggests the concept is improving but still needs reinforcement.`,
        action: libraryEntry.action || 'Schedule one focused practice session on this topic.',
        resource: libraryEntry.resource || 'Pair review with one hands-on coding challenge.',
        successCriteria: libraryEntry.successCriteria || 'Complete one timed practice task with fewer hints than last time.',
        estimatedMinutes: estimateMinutes(topic),
      };
    });
}

module.exports = { analyzeUser, getRecommendations, TOPICS };
