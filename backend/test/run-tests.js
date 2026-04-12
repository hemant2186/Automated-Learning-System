const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';

const { createApp } = require('../app');
const { getRecommendations } = require('../services/recommender');
const User = require('../models/User');
const Activity = require('../models/Activity');

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

  await run('demo session returns a seeded student payload', async () => {
    const restoreFindOne = replaceMethod(User, 'findOne', async () => null);
    const restoreCreate = replaceMethod(User, 'create', async (payload) => makeUser(payload));
    const restoreCount = replaceMethod(Activity, 'countDocuments', async () => 0);
    const restoreInsertMany = replaceMethod(Activity, 'insertMany', async () => []);

    try {
      const response = await request(app)
        .post('/api/auth/demo-session')
        .send({ role: 'student' });

      assert.equal(response.status, 200);
      assert.equal(response.body.user.role, 'student');
      assert.ok(response.body.access_token);
      assert.ok(response.body.refresh_token);
    } finally {
      restoreFindOne();
      restoreCreate();
      restoreCount();
      restoreInsertMany();
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
  });

  if (!process.exitCode) {
    console.log('All backend tests passed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
