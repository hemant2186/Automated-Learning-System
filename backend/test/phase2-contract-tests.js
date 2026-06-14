const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const LearningPath = require('../models/LearningPath');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const UserPath = require('../models/UserPath');
const UserProgress = require('../models/UserProgress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const {
  makeLesson,
  makeModule,
  makePath,
  makeQueryResult,
} = require('./helpers/phase2Fixtures');

const SUMMARY_KEYS = [
  'id',
  'title',
  'slug',
  'description',
  'category',
  'difficulty',
  'estimatedHours',
  'lessonCount',
  'quizCount',
  'projectCount',
  'resourceCount',
  'tags',
  'icon',
  'order',
  'certificateEnabled',
  'portfolioReady',
];

const CATALOG_KEYS = SUMMARY_KEYS;
const PATH_DETAIL_KEYS = [...SUMMARY_KEYS, 'topics', 'modules'];
const MODULE_KEYS = ['id', 'title', 'slug', 'description', 'order', 'lessonCount', 'lessons'];
const LESSON_META_KEYS = ['id', 'title', 'slug', 'durationMinutes', 'hasQuiz', 'topic', 'order'];

const RESTRICTED_KEYS = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'isPublished',
  'pathId',
  'moduleId',
  'solutionOutline',
  'correctKey',
  'explanation',
  'questions',
  'user',
  'users',
  'email',
  'password',
  'hashedPassword',
  'tokens',
  'profile',
  'role',
]);

function assertExactKeys(value, expectedKeys) {
  assert.deepEqual(Object.keys(value).sort(), [...expectedKeys].sort());
}

function collectRestrictedKeys(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRestrictedKeys(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (!value || typeof value !== 'object') {
    return findings;
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (RESTRICTED_KEYS.has(key)) {
      findings.push(childPath);
    }
    collectRestrictedKeys(child, childPath, findings);
  });

  return findings;
}

function assertNoRestrictedKeys(body) {
  const findings = collectRestrictedKeys(body);
  assert.deepEqual(findings, []);
}

function assertNoQuizAnswerLeakage(body) {
  const findings = collectRestrictedKeys(body).filter((path) => (
    path.endsWith('.correctKey') ||
    path.endsWith('.explanation') ||
    path.endsWith('._id') ||
    path.endsWith('.answers')
  ));

  assert.deepEqual(findings, []);
}

function installPhase2ModelStubs(replaceMethod) {
  const path = makePath();
  const moduleDoc = makeModule();
  const lesson = makeLesson();

  const restoreFind = replaceMethod(LearningPath, 'find', () => makeQueryResult([path]));
  const restoreFindOne = replaceMethod(LearningPath, 'findOne', () => makeQueryResult(path));
  const restoreModuleFind = replaceMethod(Module, 'find', () => makeQueryResult([moduleDoc]));
  const restoreLessonFind = replaceMethod(Lesson, 'find', () => makeQueryResult([lesson]));

  return () => {
    restoreFind();
    restoreFindOne();
    restoreModuleFind();
    restoreLessonFind();
  };
}

function installLessonApiStubs(replaceMethod) {
  const lesson = makeLesson();
  const moduleDoc = makeModule();
  const path = makePath();
  const nextLesson = makeLesson({
    _id: { toString: () => 'lesson-2' },
    slug: 'operators',
    title: 'Operators',
    order: 2,
    moduleId: moduleDoc._id,
    pathId: path._id,
    isPublished: true,
    content: '# Next lesson',
    practice: { prompt: 'Practice next lesson', hints: ['Hint 1'], solutionOutline: 'Hidden' },
  });

  const restoreFindOne = replaceMethod(Lesson, 'findOne', (query) => {
    if (query.slug === lesson.slug) {
      return makeQueryResult(lesson);
    }
    return makeQueryResult(null);
  });
  const restoreLessonFind = replaceMethod(Lesson, 'find', () => makeQueryResult([lesson, nextLesson]));
  const restoreModuleFind = replaceMethod(Module, 'find', () => makeQueryResult([moduleDoc]));
  const restoreModuleFindOne = replaceMethod(Module, 'findOne', () => makeQueryResult(moduleDoc));
  const restorePathFindOne = replaceMethod(LearningPath, 'findOne', () => makeQueryResult(path));

  return () => {
    restoreFindOne();
    restoreLessonFind();
    restoreModuleFind();
    restoreModuleFindOne();
    restorePathFindOne();
  };
}

function installCrossModuleNavigationStubs(replaceMethod) {
  const path = makePath({
    title: 'Python Fundamentals',
    slug: 'python-fundamentals',
    _id: { toString: () => 'path-1' },
  });

  const moduleA = makeModule({
    _id: { toString: () => 'module-a' },
    title: 'Module A',
    slug: 'module-a',
    order: 1,
    pathId: path._id,
  });

  const moduleB = makeModule({
    _id: { toString: () => 'module-b' },
    title: 'Module B',
    slug: 'module-b',
    order: 2,
    pathId: path._id,
  });

  const lessonA1 = makeLesson({
    _id: { toString: () => 'lesson-a1' },
    title: 'Lesson A1',
    slug: 'lesson-a1',
    order: 1,
    moduleId: moduleA._id,
    pathId: path._id,
  });

  const lessonA2 = makeLesson({
    _id: { toString: () => 'lesson-a2' },
    title: 'Lesson A2',
    slug: 'lesson-a2',
    order: 2,
    moduleId: moduleA._id,
    pathId: path._id,
  });

  const lessonB1 = makeLesson({
    _id: { toString: () => 'lesson-b1' },
    title: 'Lesson B1',
    slug: 'lesson-b1',
    order: 1,
    moduleId: moduleB._id,
    pathId: path._id,
  });

  const lessonB2 = makeLesson({
    _id: { toString: () => 'lesson-b2' },
    title: 'Lesson B2',
    slug: 'lesson-b2',
    order: 2,
    moduleId: moduleB._id,
    pathId: path._id,
  });

  const allLessons = [lessonA1, lessonA2, lessonB1, lessonB2];

  const restoreFindOne = replaceMethod(Lesson, 'findOne', (query) => {
    const lessonMatch = allLessons.find((lessonDoc) => lessonDoc.slug === query.slug);
    return makeQueryResult(lessonMatch || null);
  });

  const restoreLessonFind = replaceMethod(Lesson, 'find', () => makeQueryResult(allLessons));
  const restoreModuleFind = replaceMethod(Module, 'find', () => makeQueryResult([moduleA, moduleB]));
  const restoreModuleFindOne = replaceMethod(Module, 'findOne', (query) => {
    if (query._id.toString() === moduleA._id.toString()) {
      return makeQueryResult(moduleA);
    }
    if (query._id.toString() === moduleB._id.toString()) {
      return makeQueryResult(moduleB);
    }
    return makeQueryResult(null);
  });
  const restorePathFindOne = replaceMethod(LearningPath, 'findOne', () => makeQueryResult(path));

  return {
    restore: () => {
      restoreFindOne();
      restoreLessonFind();
      restoreModuleFind();
      restoreModuleFindOne();
      restorePathFindOne();
    },
    lessons: { lessonA1, lessonA2, lessonB1, lessonB2 },
  };
}

function installProgressApiStubs(replaceMethod, { enrolled = true } = {}) {
  const path = makePath();
  const lesson = makeLesson({
    _id: { toString: () => 'lesson-1' },
    slug: 'variables',
    title: 'Variables',
    order: 1,
    moduleId: makeModule()._id,
    pathId: path._id,
    durationMinutes: 20,
  });

  const baseUserPath = {
    _id: { toString: () => 'userpath-1' },
    userId: { toString: () => 'user-1' },
    pathId: path._id,
    progressPercent: 18,
    status: 'in-progress',
    currentLessonId: lesson._id,
    enrolledAt: new Date('2026-01-03T00:00:00Z'),
    startedAt: new Date('2026-01-03T00:00:00Z'),
    lastAccessedAt: new Date('2026-01-04T00:00:00Z'),
    completedAt: null,
  };

  const userPath = enrolled ? baseUserPath : null;

  const restoreUserPathFind = replaceMethod(require('../models/UserPath'), 'find', () => makeQueryResult(enrolled ? [baseUserPath] : []));
  const restoreUserPathFindOne = replaceMethod(require('../models/UserPath'), 'findOne', (query) => {
    if (query.slug === path.slug) {
      return makeQueryResult(path);
    }
    if (query.userId && query.pathId && query.pathId.toString() === path._id.toString()) {
      return makeQueryResult(userPath);
    }
    return makeQueryResult(null);
  });
  const restoreLearningPathFind = replaceMethod(require('../models/LearningPath'), 'find', () => makeQueryResult([path]));
  const restoreLearningPathFindOne = replaceMethod(require('../models/LearningPath'), 'findOne', (query) => {
    if (query.slug === path.slug) {
      return makeQueryResult(path);
    }
    return makeQueryResult(null);
  });
  const restoreModuleFind = replaceMethod(require('../models/Module'), 'find', () => makeQueryResult([makeModule({ pathId: path._id })]));
  const restoreLessonFind = replaceMethod(require('../models/Lesson'), 'find', () => makeQueryResult([lesson]));
  const restoreLessonFindOne = replaceMethod(require('../models/Lesson'), 'findOne', (query) => {
    if (query._id && query._id.toString && query._id.toString() === lesson._id.toString()) {
      return makeQueryResult(lesson);
    }
    if (query.slug === lesson.slug) {
      return makeQueryResult(lesson);
    }
    if (query.pathId && query.moduleId && query.pathId.toString && query.moduleId.toString && query.pathId.toString() === path._id.toString() && query.moduleId.toString() === lesson.moduleId.toString()) {
      return makeQueryResult(lesson);
    }
    return makeQueryResult(null);
  });
  const restoreUserPathCreate = replaceMethod(require('../models/UserPath'), 'create', async (payload) => ({
    ...baseUserPath,
    ...payload,
    _id: { toString: () => 'userpath-1' },
  }));

  return {
    restore: () => {
      restoreUserPathFind();
      restoreUserPathFindOne();
      restoreLearningPathFind();
      restoreLearningPathFindOne();
      restoreLessonFind();
      restoreLessonFindOne();
      restoreUserPathCreate();
    },
    fixtures: { path, lesson, userPath: baseUserPath },
  };
}

function makeQuiz(overrides = {}) {
  return {
    _id: { toString: () => 'quiz-1' },
    title: 'Variables Checkpoint Quiz',
    lessonId: { toString: () => 'lesson-1' },
    pathId: { toString: () => 'path-1' },
    passingScore: 70,
    isPublished: true,
    questions: [
      {
        _id: { toString: () => 'question-1' },
        order: 1,
        prompt: 'Which variable name is valid?',
        options: [
          { key: 'A', text: '2score' },
          { key: 'B', text: 'score_total' },
          { key: 'C', text: 'score-total' },
          { key: 'D', text: 'for' },
        ],
        correctKey: 'B',
        explanation: 'Hidden explanation',
      },
      {
        _id: { toString: () => 'question-2' },
        order: 2,
        prompt: 'What is x after x = 1; x = x + 1?',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: '11' },
          { key: 'C', text: '2' },
          { key: 'D', text: 'x' },
        ],
        correctKey: 'C',
        explanation: 'Hidden explanation',
      },
    ],
    ...overrides,
  };
}

function installQuizApiStubs(replaceMethod, { enrolled = true, latestAttempt = null } = {}) {
  const path = makePath();
  const lesson = makeLesson({
    _id: { toString: () => 'lesson-1' },
    pathId: path._id,
    moduleId: makeModule()._id,
    slug: 'variables',
    hasQuiz: true,
  });
  const quiz = makeQuiz({
    lessonId: lesson._id,
    pathId: path._id,
  });
  const userPath = enrolled
    ? {
        _id: { toString: () => 'userpath-1' },
        userId: { toString: () => 'user-1' },
        pathId: path._id,
      }
    : null;

  const restoreLessonFindOne = replaceMethod(Lesson, 'findOne', (query) => {
    if (query.slug === lesson.slug) {
      return makeQueryResult(lesson);
    }
    return makeQueryResult(null);
  });
  const restoreQuizFindOne = replaceMethod(Quiz, 'findOne', () => makeQueryResult(quiz));
  const restoreUserPathFindOne = replaceMethod(UserPath, 'findOne', () => makeQueryResult(userPath));
  const restoreQuizAttemptFindOne = replaceMethod(QuizAttempt, 'findOne', () => makeQueryResult(latestAttempt));

  return {
    restore: () => {
      restoreLessonFindOne();
      restoreQuizFindOne();
      restoreUserPathFindOne();
      restoreQuizAttemptFindOne();
    },
    fixtures: { lesson, quiz, path },
  };
}

async function registerPhase2ContractTests({ app, run, replaceMethod }) {
  await run('Phase 2 GET /api/catalog exposes only the public catalog DTO', async () => {
    const restore = installPhase2ModelStubs(replaceMethod);

    try {
      const response = await request(app).get('/api/catalog');

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['items', 'total', 'filters']);
      assert.equal(response.body.total, 1);
      assertExactKeys(response.body.items[0], CATALOG_KEYS);
      assertExactKeys(response.body.filters, ['category', 'difficulty', 'search', 'sort']);
      assert.equal(typeof response.body.items[0].id, 'string');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
    }
  });

  await run('Phase 2 GET /api/paths exposes only the public path summary DTO', async () => {
    const restore = installPhase2ModelStubs(replaceMethod);

    try {
      const response = await request(app).get('/api/paths');

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['items', 'total']);
      assert.equal(response.body.total, 1);
      assertExactKeys(response.body.items[0], SUMMARY_KEYS);
      assert.equal(typeof response.body.items[0].id, 'string');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
    }
  });

  await run('Phase 2 GET /api/catalog and GET /api/paths share the same public summary DTO', async () => {
    const restore = installPhase2ModelStubs(replaceMethod);

    try {
      const catalogResponse = await request(app).get('/api/catalog');
      const pathsResponse = await request(app).get('/api/paths');

      assert.equal(catalogResponse.status, 200);
      assert.equal(pathsResponse.status, 200);
      assert.deepEqual(
        Object.keys(catalogResponse.body.items[0]).sort(),
        Object.keys(pathsResponse.body.items[0]).sort()
      );
      assertExactKeys(catalogResponse.body.items[0], SUMMARY_KEYS);
      assertExactKeys(pathsResponse.body.items[0], SUMMARY_KEYS);
      assertNoRestrictedKeys(catalogResponse.body);
      assertNoRestrictedKeys(pathsResponse.body);
    } finally {
      restore();
    }
  });

  await run('Phase 2 GET /api/paths/:slug exposes only path, module, and lesson metadata', async () => {
    const restore = installPhase2ModelStubs(replaceMethod);

    try {
      const response = await request(app).get('/api/paths/javascript-foundations');

      assert.equal(response.status, 200);
      assertExactKeys(response.body, PATH_DETAIL_KEYS);
      assertExactKeys(response.body.modules[0], MODULE_KEYS);
      assertExactKeys(response.body.modules[0].lessons[0], LESSON_META_KEYS);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.modules[0].id, 'string');
      assert.equal(typeof response.body.modules[0].lessons[0].id, 'string');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
    }
  });

  await run('Phase 3 GET /api/lessons/:slug returns lesson DTO with navigation and no hidden fields', async () => {
    const restore = installLessonApiStubs(replaceMethod);

    try {
      const response = await request(app).get('/api/lessons/variables');

      assert.equal(response.status, 200);
      assertExactKeys(response.body, [
        'id',
        'title',
        'slug',
        'topic',
        'durationMinutes',
        'contentFormat',
        'content',
        'exampleCode',
        'practice',
        'hasQuiz',
        'path',
        'module',
        'previousLesson',
        'nextLesson',
      ]);
      assertExactKeys(response.body.path, ['id', 'slug', 'title']);
      assertExactKeys(response.body.module, ['id', 'slug', 'title']);
      assertExactKeys(response.body.practice, ['prompt', 'hints']);
      assert.equal(response.body.previousLesson, null);
      assert.equal(response.body.nextLesson.slug, 'operators');
      assert.equal(response.body.hasQuiz, true);
      assertNoRestrictedKeys(response.body);
      assert.equal(typeof response.body.id, 'string');
      assert.equal(typeof response.body.path.id, 'string');
      assert.equal(typeof response.body.module.id, 'string');
    } finally {
      restore();
    }
  });

  await run('Phase 3.1 GET /api/lessons/:slug navigation transitions across modules correctly', async () => {
    const { restore, lessons } = installCrossModuleNavigationStubs(replaceMethod);

    try {
      const firstResponse = await request(app).get('/api/lessons/lesson-a1');
      assert.equal(firstResponse.status, 200);
      assert.equal(firstResponse.body.previousLesson, null);
      assert.equal(firstResponse.body.nextLesson.slug, 'lesson-a2');

      const lastResponse = await request(app).get('/api/lessons/lesson-b2');
      assert.equal(lastResponse.status, 200);
      assert.equal(lastResponse.body.nextLesson, null);
      assert.equal(lastResponse.body.previousLesson.slug, 'lesson-b1');

      const crossResponse = await request(app).get('/api/lessons/lesson-a2');
      assert.equal(crossResponse.status, 200);
      assert.equal(crossResponse.body.nextLesson.slug, 'lesson-b1');
      assert.equal(crossResponse.body.previousLesson.slug, 'lesson-a1');

      const backResponse = await request(app).get('/api/lessons/lesson-b1');
      assert.equal(backResponse.status, 200);
      assert.equal(backResponse.body.previousLesson.slug, 'lesson-a2');
      assert.equal(backResponse.body.nextLesson.slug, 'lesson-b2');
    } finally {
      restore();
    }
  });

  await run('Phase 4 GET /api/progress returns enrolled paths overview with safe DTOs', async () => {
    const { restore, fixtures } = installProgressApiStubs(replaceMethod);
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['items', 'total']);
      assert.equal(response.body.total, 1);
      assertExactKeys(response.body.items[0], [
        'id',
        'status',
        'progressPercent',
        'currentLesson',
        'enrolledAt',
        'startedAt',
        'lastAccessedAt',
        'completedAt',
        'path',
      ]);
      assertExactKeys(response.body.items[0].path, SUMMARY_KEYS);
      assertExactKeys(response.body.items[0].currentLesson, ['id', 'title', 'slug']);
      assert.equal(typeof response.body.items[0].id, 'string');
      assert.equal(typeof response.body.items[0].path.id, 'string');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
      restoreUserFindById();
    }
  });

  await run('Phase 4 GET /api/progress/:slug returns enrollment state and path metadata', async () => {
    const { restore, fixtures } = installProgressApiStubs(replaceMethod);
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .get(`/api/progress/${fixtures.path.slug}`)
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['path', 'enrollment']);
      assertExactKeys(response.body.path, SUMMARY_KEYS);
      assertExactKeys(response.body.enrollment, [
        'id',
        'status',
        'progressPercent',
        'currentLesson',
        'enrolledAt',
        'startedAt',
        'lastAccessedAt',
        'completedAt',
        'path',
      ]);
      assert.equal(response.body.enrollment.currentLesson.slug, 'variables');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
      restoreUserFindById();
    }
  });

  await run('Phase 4 POST /api/progress/:slug/enroll creates or returns enrollment', async () => {
    const { restore, fixtures } = installProgressApiStubs(replaceMethod, { enrolled: false });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .post(`/api/progress/${fixtures.path.slug}/enroll`)
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 201);
      assertExactKeys(response.body, [
        'id',
        'status',
        'progressPercent',
        'currentLesson',
        'enrolledAt',
        'startedAt',
        'lastAccessedAt',
        'completedAt',
        'path',
      ]);
      assert.equal(response.body.currentLesson.slug, 'variables');
      assert.equal(response.body.status, 'not-started');
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
      restoreUserFindById();
    }
  });

  await run('Phase 4.2 POST /api/progress/lessons/:lessonSlug/complete marks lesson complete', async () => {
    const { restore, fixtures } = installProgressApiStubs(replaceMethod, { enrolled: true });
    const pathId = fixtures.path._id;
    const lessonId = fixtures.lesson._id;
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));
    const restoreLessonFindOne = replaceMethod(Lesson, 'findOne', (query) => {
      if (query.slug === fixtures.lesson.slug) {
        // Return a properly structured lesson with real ObjectIds
        return makeQueryResult({
          _id: lessonId,
          slug: fixtures.lesson.slug,
          pathId: pathId,
          moduleId: fixtures.lesson.moduleId,
          title: fixtures.lesson.title,
        });
      }
      return makeQueryResult(null);
    });
    const restoreUserProgressFindOneAndUpdate = replaceMethod(UserProgress, 'findOneAndUpdate', async (filter, update) => ({
      _id: { toString: () => 'progress-1' },
      userId: filter.userId,
      lessonId: filter.lessonId,
      pathId: pathId,
      type: 'lesson',
      completed: true,
      completedAt: new Date(),
    }));
    const restoreUserProgressCountDocuments = replaceMethod(UserProgress, 'countDocuments', async (filter) => {
      if (filter.completed && filter.type === 'lesson') return 1;
      return 0;
    });
    const restoreLessonCountDocuments = replaceMethod(Lesson, 'countDocuments', async (filter) => {
      if (filter.isPublished) return 3;
      return 0;
    });
    const restoreUserPathUpdateOne = replaceMethod(UserPath, 'updateOne', async (filter, update) => ({
      matchedCount: 1,
      modifiedCount: 1,
    }));

    try {
      const response = await request(app)
        .post(`/api/progress/lessons/${fixtures.lesson.slug}/complete`)
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['completed', 'completedLessons', 'totalLessons', 'progressPercent']);
      assert.equal(response.body.completed, true);
      assert.equal(response.body.completedLessons, 1);
      assert.equal(response.body.totalLessons, 3);
      assert.equal(response.body.progressPercent, 33);
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
      restoreUserFindById();
      restoreLessonFindOne();
      restoreUserProgressFindOneAndUpdate();
      restoreUserProgressCountDocuments();
      restoreLessonCountDocuments();
      restoreUserPathUpdateOne();
    }
  });

  await run('Phase 4.2 POST /api/progress/lessons/:lessonSlug/complete returns 403 if not enrolled', async () => {
    const { restore, fixtures } = installProgressApiStubs(replaceMethod, { enrolled: false });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));
    const restoreLessonFindOne = replaceMethod(Lesson, 'findOne', (query) => {
      if (query.slug === fixtures.lesson.slug) {
        return makeQueryResult(fixtures.lesson);
      }
      return makeQueryResult(null);
    });

    try {
      const response = await request(app)
        .post(`/api/progress/lessons/${fixtures.lesson.slug}/complete`)
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 403);
      assert.match(response.body.error, /enroll/i);
    } finally {
      restore();
      restoreUserFindById();
      restoreLessonFindOne();
    }
  });

  await run('Phase 6 GET /api/quizzes/:lessonSlug returns safe quiz DTO without answer leakage', async () => {
    const { restore } = installQuizApiStubs(replaceMethod, { enrolled: true });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .get('/api/quizzes/variables')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['title', 'lessonSlug', 'questions']);
      assertExactKeys(response.body.questions[0], ['id', 'prompt', 'options']);
      assert.deepEqual(Object.keys(response.body.questions[0].options).sort(), ['A', 'B', 'C', 'D']);
      assertNoQuizAnswerLeakage(response.body);
    } finally {
      restore();
      restoreUserFindById();
    }
  });

  await run('Phase 6 POST /api/quizzes/:lessonSlug/submit grades and stores passed quiz completion', async () => {
    const { restore, fixtures } = installQuizApiStubs(replaceMethod, { enrolled: true });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));
    let createdAttempt = null;
    let progressUpdate = null;
    const restoreAttemptCount = replaceMethod(QuizAttempt, 'countDocuments', async () => 1);
    const restoreAttemptCreate = replaceMethod(QuizAttempt, 'create', async (payload) => {
      createdAttempt = payload;
      return payload;
    });
    const restoreProgressUpdate = replaceMethod(UserProgress, 'findOneAndUpdate', async (filter, update) => {
      progressUpdate = { filter, update };
      return update.$set;
    });

    try {
      const response = await request(app)
        .post('/api/quizzes/variables/submit')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`)
        .send({
          answers: {
            'question-1': 'B',
            'question-2': 'C',
          },
        });

      assert.equal(response.status, 201);
      assert.deepEqual(response.body, {
        score: 100,
        correct: 2,
        total: 2,
        passed: true,
      });
      assert.equal(createdAttempt.score, 100);
      assert.equal(createdAttempt.correct, 2);
      assert.equal(createdAttempt.total, 2);
      assert.equal(createdAttempt.passed, true);
      assert.equal(createdAttempt.attemptNumber, 2);
      assert.equal(progressUpdate.filter.type, 'quiz');
      assert.equal(progressUpdate.update.$set.quizId.toString(), fixtures.quiz._id.toString());
      assert.equal(progressUpdate.update.$set.completed, true);
    } finally {
      restore();
      restoreUserFindById();
      restoreAttemptCount();
      restoreAttemptCreate();
      restoreProgressUpdate();
    }
  });

  await run('Phase 6 POST /api/quizzes/:lessonSlug/submit stores failed attempt without quiz completion', async () => {
    const { restore } = installQuizApiStubs(replaceMethod, { enrolled: true });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));
    let createdAttempt = null;
    let progressUpdated = false;
    const restoreAttemptCount = replaceMethod(QuizAttempt, 'countDocuments', async () => 0);
    const restoreAttemptCreate = replaceMethod(QuizAttempt, 'create', async (payload) => {
      createdAttempt = payload;
      return payload;
    });
    const restoreProgressUpdate = replaceMethod(UserProgress, 'findOneAndUpdate', async () => {
      progressUpdated = true;
    });

    try {
      const response = await request(app)
        .post('/api/quizzes/variables/submit')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`)
        .send({
          answers: {
            'question-1': 'A',
            'question-2': 'A',
          },
        });

      assert.equal(response.status, 201);
      assert.deepEqual(response.body, {
        score: 0,
        correct: 0,
        total: 2,
        passed: false,
      });
      assert.equal(createdAttempt.passed, false);
      assert.equal(progressUpdated, false);
    } finally {
      restore();
      restoreUserFindById();
      restoreAttemptCount();
      restoreAttemptCreate();
      restoreProgressUpdate();
    }
  });

  await run('Phase 6 GET /api/quizzes/:lessonSlug/results returns latest result only', async () => {
    const latestAttempt = {
      score: 50,
      correct: 1,
      total: 2,
      passed: false,
      completedAt: new Date('2026-02-01T00:00:00Z'),
      answers: [{ selectedKey: 'A', correct: false }],
    };
    const { restore } = installQuizApiStubs(replaceMethod, { enrolled: true, latestAttempt });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .get('/api/quizzes/variables/results')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 200);
      assertExactKeys(response.body, ['score', 'correct', 'total', 'passed', 'completedAt']);
      assert.equal(response.body.score, 50);
      assertNoRestrictedKeys(response.body);
    } finally {
      restore();
      restoreUserFindById();
    }
  });

  await run('Phase 6 quiz endpoints return 403 for non-enrolled users', async () => {
    const { restore } = installQuizApiStubs(replaceMethod, { enrolled: false });
    const restoreUserFindById = replaceMethod(User, 'findById', async () => ({ _id: { toString: () => 'user-1' } }));

    try {
      const response = await request(app)
        .get('/api/quizzes/variables')
        .set('Authorization', `Bearer ${jwt.sign({ id: 'user-1', type: 'access' }, process.env.JWT_SECRET)}`);

      assert.equal(response.status, 403);
      assert.match(response.body.error, /enroll/i);
    } finally {
      restore();
      restoreUserFindById();
    }
  });
}

module.exports = {
  registerPhase2ContractTests,
};
