const Activity = require('../models/Activity');
const User = require('../models/User');
const { TOPICS, calculateMastery, getStatus } = require('./analysis');

const RESOURCE_LIBRARY = {
  'Computer Basics': {
    action: 'Review file navigation, terminals, editors, and program execution basics.',
    resource: 'Walk through a short setup checklist and run 3 tiny programs end-to-end.',
  },
  'Variables and Data Types': {
    action: 'Practice assigning values, converting types, and tracing how data changes.',
    resource: 'Build a mini score tracker using strings, numbers, and booleans.',
  },
  Operators: {
    action: 'Compare arithmetic, comparison, and logical operators with quick drills.',
    resource: 'Solve five conditional exercises and explain each result in plain language.',
  },
  'Control Structures': {
    action: 'Use `if`, `else if`, and `else` to express decisions clearly.',
    resource: 'Create a grade classifier and test it with edge-case inputs.',
  },
  Loops: {
    action: 'Focus on loop tracing, counters, and stopping conditions.',
    resource: 'Complete a loop worksheet, then code a repetition challenge from scratch.',
  },
  Functions: {
    action: 'Break larger tasks into named, reusable chunks with parameters and return values.',
    resource: 'Refactor one long script into three smaller helper functions.',
  },
  Arrays: {
    action: 'Practice indexing, iteration, and simple transformations with lists.',
    resource: 'Build a to-do list or shopping list program with add/remove flows.',
  },
  Objects: {
    action: 'Organize related values using keys and nested data.',
    resource: 'Model a student profile object and print a formatted summary.',
  },
  Classes: {
    action: 'Introduce object-oriented ideas only after functions and objects feel steady.',
    resource: 'Create a simple `StudentProgress` class with a couple of methods.',
  },
  'Web Development Basics': {
    action: 'Bridge into routes, APIs, and data flow between frontend and backend.',
    resource: 'Connect a small form to an API endpoint and store the submitted data.',
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

  const nextRecommendedTopic =
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
  };
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
      },
      {
        topic: 'Variables and Data Types',
        level: 'starter',
        reason: 'Early familiarity with values and types makes every later topic less confusing.',
        action: RESOURCE_LIBRARY['Variables and Data Types'].action,
        resource: RESOURCE_LIBRARY['Variables and Data Types'].resource,
      },
    ];
  }

  return analysis.topicBreakdown
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
      };
    });
}

module.exports = { analyzeUser, getRecommendations, TOPICS };
