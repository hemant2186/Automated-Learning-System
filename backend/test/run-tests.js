const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';

const { createApp } = require('../app');
const { analyzeUser, getRecommendations } = require('../services/recommender');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const LearningPath = require('../models/LearningPath');
const UserProgress = require('../models/UserProgress');
const Quiz = require('../models/Quiz');
const CodingExercise = require('../models/CodingExercise');
const pathService = require('../services/pathService');
const CodeSubmission = require('../models/CodeSubmission');
const codeExecutionService = require('../services/codeExecutionService');
const { registerPhase2ContractTests } = require('./phase2-contract-tests');

function makeUser(overrides = {}) {
  return {
    _id: { toString: () => 'user-1' },
    name: 'Test User',
    email: 'test@example.com',
    role: 'student',
    skillLevel: 'beginner',
    goals: ['loops'],
    preferences: {},
    points: 0,
    badges: [],
    streak: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function replaceMethod(target, name, value) {
  const original = target[name];
  target[name] = value;
  return () => {
    target[name] = original;
  };
}

function makeQueryResult(result) {
  return {
    select() { return this; },
    sort() { return this; },
    lean() { return Promise.resolve(result); },
  };
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function main() {
  const app = createApp();

  await run('GET /api/health returns ok', async () => {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });

  await run('auth login is rate limited after repeated attempts', async () => {
    const restoreFindOne = replaceMethod(User, 'findOne', async () => null);
    try {
      let finalResponse;
      for (let attempt = 0; attempt < 11; attempt += 1) {
        finalResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: 'unknown@example.com', password: 'WrongPassword1' });
      }
      assert.equal(finalResponse.status, 429);
      assert.deepEqual(finalResponse.body, {
        error: 'Too many authentication attempts. Please try again later.',
      });
    } finally {
      restoreFindOne();
    }
  });

  await run('demo session returns a seeded student payload', async () => {
    const restoreFindOne = replaceMethod(User, 'findOne', async () => null);
    const restoreCreate = replaceMethod(User, 'create', async (payload) => makeUser(payload));
    const restoreCount = replaceMethod(Activity, 'countDocuments', async () => 0);
    let seededActivities = [];
    const restoreInsertMany = replaceMethod(Activity, 'insertMany', async (docs) => {
      seededActivities = docs;
      return docs;
    });
    const restoreLessonFindOne = replaceMethod(Lesson, 'findOne', () => makeQueryResult(null));

    try {
      const response = await request(app)
        .post('/api/auth/demo-session')
        .send({ role: 'student' });

      assert.equal(response.status, 200);
      assert.equal(response.body.user.role, 'student');
      assert.ok(response.body.access_token);
      assert.ok(response.body.refresh_token);

      const restoreActivityFind = replaceMethod(Activity, 'find', () => ({
        sort() { return Promise.resolve(seededActivities); },
      }));
      const restoreUserFindById = replaceMethod(User, 'findById', async () => makeUser());
      try {
        const analysis = await analyzeUser('user-1');
        assert.notEqual(analysis.trend, 'insufficient-data');
        assert.ok(analysis.reviewQueue.length > 0);
      } finally {
        restoreActivityFind();
        restoreUserFindById();
      }
    } finally {
      restoreFindOne();
      restoreCreate();
      restoreCount();
      restoreInsertMany();
      restoreLessonFindOne();
    }
  });

  await run('authenticated profile routes return and update the current user', async () => {
    const existingUser = makeUser();
    const updatedUser = makeUser({
      name: 'Updated User',
      skillLevel: 'intermediate',
      goals: ['functions', 'arrays'],
      preferences: { weeklyGoal: '5 sessions' },
    });

    const restoreFindById = replaceMethod(User, 'findById', async () => existingUser);
    const restoreFindByIdAndUpdate = replaceMethod(User, 'findByIdAndUpdate', async () => updatedUser);

    try {
      const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(meResponse.status, 200);
      assert.equal(meResponse.body.email, 'test@example.com');

      const updateResponse = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated User',
          skillLevel: 'intermediate',
          goals: ['functions', 'arrays'],
          preferences: { weeklyGoal: '5 sessions' },
        });

      assert.equal(updateResponse.status, 200);
      assert.equal(updateResponse.body.name, 'Updated User');
      assert.equal(updateResponse.body.skillLevel, 'intermediate');
      assert.deepEqual(updateResponse.body.goals, ['functions', 'arrays']);
    } finally {
      restoreFindById();
      restoreFindByIdAndUpdate();
    }
  });

  await run('activity ingestion validates topics and normalizes scoring inputs', async () => {
    const userId = '665000000000000000000001';
    const existingUser = makeUser({ _id: userId });

    const restoreFindById = replaceMethod(User, 'findById', async () => existingUser);
    const restoreFindByIdAndUpdate = replaceMethod(User, 'findByIdAndUpdate', async () => existingUser);
    const originalSave = Activity.prototype.save;
    Activity.prototype.save = async function saveActivity() {
      return this;
    };

    try {
      const token = jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const invalidResponse = await request(app)
        .post('/api/activity/ingest')
        .set('Authorization', `Bearer ${token}`)
        .send({
          topic: 'Unsupported Topic',
          quizScore: 900,
          codingScore: -20,
        });

      assert.equal(invalidResponse.status, 400);
      assert.match(invalidResponse.body.error, /supported learning path/);

      const response = await request(app)
        .post('/api/activity/ingest')
        .set('Authorization', `Bearer ${token}`)
        .send({
          topic: 'Loops',
          quizScore: 120,
          codingScore: -10,
          timeSpent: 999,
          attempts: 0,
          completed: true,
          feedback: '  Need more loop tracing.  ',
        });

      assert.equal(response.status, 201);
      assert.equal(response.body.topic, 'Loops');
      assert.equal(response.body.quizScore, 100);
      assert.equal(response.body.codingScore, 0);
      assert.equal(response.body.timeSpent, 480);
      assert.equal(response.body.attempts, 1);
      assert.equal(response.body.feedback, 'Need more loop tracing.');
      assert.equal(response.body.pointsEarned, 60);
    } finally {
      restoreFindById();
      restoreFindByIdAndUpdate();
      Activity.prototype.save = originalSave;
    }
  });

  await run('GET /api/resources returns published resources only', async () => {
    const resource = {
      _id: { toString: () => 'resource-1' },
      title: 'Python Guide', slug: 'python-guide', description: 'A guide.', url: 'https://example.com',
      type: 'documentation', category: 'programming-languages', programmingLanguage: 'python',
      difficulty: 'beginner', tags: ['python'], pathId: null, lessonId: null, isExternal: true,
    };
    const restoreFind = replaceMethod(Resource, 'find', () => makeQueryResult([resource]));
    try {
      const response = await request(app).get('/api/resources?category=programming-languages');
      assert.equal(response.status, 200);
      assert.equal(response.body.total, 1);
      assert.equal(response.body.items[0].title, 'Python Guide');
      assert.equal(response.body.items[0].isPublished, undefined);
    } finally {
      restoreFind();
    }
  });

  await run('GET /api/progress/me returns per-path completion aggregates', async () => {
    const path = { _id: { toString: () => 'path-1' }, title: 'Python Fundamentals', slug: 'python-fundamentals', lessonCount: 4, quizCount: 2 };
    const progress = [
      { pathId: path._id, type: 'lesson', completed: true },
      { pathId: path._id, type: 'quiz', completed: true },
      { pathId: path._id, type: 'code-exercise', completed: true },
    ];
    const restoreUserFindById = replaceMethod(User, 'findById', async () => makeUser());
    const restorePathFind = replaceMethod(LearningPath, 'find', () => makeQueryResult([path]));
    const restoreProgressFind = replaceMethod(UserProgress, 'find', () => makeQueryResult(progress));
    const restoreCodeCount = replaceMethod(CodingExercise, 'countDocuments', async () => 1);
    try {
      const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
      const response = await request(app).get('/api/progress/me').set('Authorization', `Bearer ${token}`);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body.items[0], {
        path: { id: 'path-1', title: 'Python Fundamentals', slug: 'python-fundamentals' },
        lessonsCompleted: 1, totalLessons: 4, quizzesPassed: 1, totalQuizzes: 2,
        codeExercisesPassed: 1, totalCodeExercises: 1, percentComplete: 43,
      });
    } finally {
      restoreUserFindById();
      restorePathFind();
      restoreProgressFind();
      restoreCodeCount();
    }
  });

  await run('POST /api/onboarding completes onboarding and suggests a path', async () => {
    const updatedUser = makeUser({ skillLevel: 'intermediate', goals: ['web development'], onboardingCompleted: true });
    const restoreFindById = replaceMethod(User, 'findById', async () => makeUser());
    const restoreUpdate = replaceMethod(User, 'findByIdAndUpdate', async () => updatedUser);
    const restorePaths = replaceMethod(pathService, 'listPublishedPaths', async () => ({
      items: [
        { id: 'beginner-path', slug: 'beginner-path', title: 'Beginner Path', difficulty: 'beginner', order: 1 },
        { id: 'intermediate-path', slug: 'intermediate-path', title: 'Intermediate Path', difficulty: 'intermediate', order: 2 },
      ],
      total: 2,
    }));
    try {
      const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
      const response = await request(app)
        .post('/api/onboarding')
        .set('Authorization', `Bearer ${token}`)
        .send({ skillLevel: 'intermediate', goals: ['web development'] });
      assert.equal(response.status, 200);
      assert.equal(response.body.onboardingCompleted, true);
      assert.equal(response.body.suggestedPath.slug, 'intermediate-path');
    } finally {
      restoreFindById();
      restoreUpdate();
      restorePaths();
    }
  });

  await run('GET /api/admin/overview blocks non-admins and returns counts for admins', async () => {
    const restoreFindById = replaceMethod(User, 'findById', async () => makeUser({ role: 'student' }));
    const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
    const denied = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`);
    assert.equal(denied.status, 403);
    restoreFindById();

    const restoreAdminFindById = replaceMethod(User, 'findById', async () => makeUser({ role: 'admin' }));
    const restoreUserCount = replaceMethod(User, 'countDocuments', async (filter) => filter.role === 'student' ? 3 : filter.role === 'instructor' ? 1 : 1);
    const restorePathCount = replaceMethod(LearningPath, 'countDocuments', async () => 2);
    const restoreLessonCount = replaceMethod(Lesson, 'countDocuments', async () => 4);
    const restoreQuizCount = replaceMethod(Quiz, 'countDocuments', async () => 1);
    const restoreExerciseCount = replaceMethod(CodingExercise, 'countDocuments', async () => 2);
    const restoreResourceCount = replaceMethod(Resource, 'countDocuments', async () => 5);
    try {
      const adminToken = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
      const response = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
      assert.equal(response.status, 200);
      assert.deepEqual(response.body.users, { total: 5, student: 3, instructor: 1, admin: 1 });
      assert.deepEqual(response.body.content.learningPaths, { published: 2, unpublished: 2 });
    } finally {
      restoreAdminFindById();
      restoreUserCount();
      restorePathCount();
      restoreLessonCount();
      restoreQuizCount();
      restoreExerciseCount();
      restoreResourceCount();
    }
  });

  await run('coding exercise delivery excludes hidden test cases', async () => {
    const exercise = {
      _id: { toString: () => 'exercise-1' },
      lessonId: { toString: () => 'lesson-1' },
      title: 'Double a number',
      language: 'python',
      prompt: 'Print twice the input.',
      starterCode: 'value = int(input())',
      testCases: [
        { input: '2', expectedOutput: '4', hidden: false },
        { input: '9', expectedOutput: '18', hidden: true },
      ],
    };
    const restoreExerciseFindOne = replaceMethod(CodingExercise, 'findOne', () => makeQueryResult(exercise));
    const restoreUserFindById = replaceMethod(User, 'findById', async () => makeUser());
    try {
      const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
      const response = await request(app)
        .get('/api/code-exercises/lesson/lesson-1')
        .set('Authorization', `Bearer ${token}`);
      assert.equal(response.status, 200);
      assert.equal(response.body.testCases.length, 1);
      assert.equal(response.body.testCases[0].input, '2');
      assert.doesNotMatch(JSON.stringify(response.body), /18|9/);
    } finally {
      restoreExerciseFindOne();
      restoreUserFindById();
    }
  });

  await run('coding exercise submission stores computed score and activity', async () => {
    const exercise = {
      _id: { toString: () => 'exercise-1' },
      lessonId: { toString: () => 'lesson-1' },
      pathId: { toString: () => 'path-1' },
      language: 'python',
      topic: 'Variables and Data Types',
      testCases: [{ input: '2', expectedOutput: '4', hidden: false }],
    };
    const restoreExerciseFindOne = replaceMethod(CodingExercise, 'findOne', () => makeQueryResult(exercise));
    const restoreCount = replaceMethod(CodeSubmission, 'countDocuments', async () => 1);
    let savedSubmission;
    const restoreCreate = replaceMethod(CodeSubmission, 'create', async (payload) => {
      savedSubmission = payload;
      return payload;
    });
    const restoreExecution = replaceMethod(codeExecutionService, 'runAgainstTestCases', async () => ({
      results: [{ passed: true, hidden: false, expectedOutput: '4', actualOutput: '4', error: '' }],
      passedCount: 1,
      totalCount: 1,
    }));
    const restoreFindById = replaceMethod(User, 'findById', async () => makeUser());
    const restoreUpdate = replaceMethod(User, 'findByIdAndUpdate', async () => makeUser());
    const restoreProgressUpdate = replaceMethod(UserProgress, 'findOneAndUpdate', async (filter, update) => update.$set);
    const originalSave = Activity.prototype.save;
    Activity.prototype.save = async function saveActivity() { return this; };
    try {
      const token = jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET);
      const response = await request(app)
        .post('/api/code-exercises/exercise-1/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: 'print(2 * 2)', timeSpentSeconds: 90 });
      assert.equal(response.status, 201);
      assert.equal(response.body.score, 100);
      assert.equal(response.body.passed, true);
      assert.equal(savedSubmission.score, 100);
      assert.equal(savedSubmission.attemptNumber, 2);
    } finally {
      restoreExerciseFindOne();
      restoreCount();
      restoreCreate();
      restoreExecution();
      restoreFindById();
      restoreUpdate();
      restoreProgressUpdate();
      Activity.prototype.save = originalSave;
    }
  });

  await run('getRecommendations returns starter guidance for learners with no activity', async () => {
    const recommendations = getRecommendations({
      activityCount: 0,
      nextRecommendedTopic: 'Computer Basics',
    });

    assert.ok(Array.isArray(recommendations));
    assert.ok(recommendations.length >= 1);
    assert.equal(recommendations[0].topic, 'Computer Basics');
  });

  await run('getRecommendations prioritizes weak topics from topic breakdown', async () => {
    const recommendations = getRecommendations({
      activityCount: 3,
      topicBreakdown: [
        { topic: 'Loops', mastery: 42, status: 'weak' },
        { topic: 'Functions', mastery: 61, status: 'developing' },
        { topic: 'Arrays', mastery: 88, status: 'strong' },
      ],
    });

    assert.equal(recommendations[0].topic, 'Loops');
    assert.equal(recommendations[1].topic, 'Functions');
    assert.equal(recommendations.length, 2);
    assert.ok(recommendations[0].successCriteria);
    assert.ok(recommendations[0].estimatedMinutes >= 30);
  });

  await run('getRecommendations follows the learner review queue when available', async () => {
    const recommendations = getRecommendations({
      activityCount: 4,
      reviewQueue: [
        { topic: 'Functions', priority: 'high' },
        { topic: 'Loops', priority: 'medium' },
      ],
      topicBreakdown: [
        { topic: 'Loops', mastery: 62, status: 'developing', averageAttempts: 2 },
        { topic: 'Functions', mastery: 39, status: 'weak', averageAttempts: 4 },
        { topic: 'Arrays', mastery: 30, status: 'weak', averageAttempts: 1 },
      ],
    });

    assert.equal(recommendations[0].topic, 'Functions');
    assert.equal(recommendations[1].topic, 'Loops');
  });

  await registerPhase2ContractTests({
    app,
    run,
    replaceMethod,
  });

  if (!process.exitCode) {
    console.log('All backend tests passed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
