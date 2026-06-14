function objectId(value) {
  return {
    toString: () => value,
  };
}

function makeQueryResult(result) {
  return {
    select() {
      return this;
    },
    sort() {
      return this;
    },
    lean() {
      return Promise.resolve(result);
    },
  };
}

function makePath(overrides = {}) {
  return {
    _id: objectId('path-1'),
    title: 'JavaScript Foundations',
    slug: 'javascript-foundations',
    description: 'A careful introduction to JavaScript.',
    category: 'programming-languages',
    difficulty: 'beginner',
    estimatedHours: 12,
    lessonCount: 2,
    quizCount: 1,
    projectCount: 1,
    resourceCount: 3,
    tags: ['javascript', 'basics'],
    icon: 'code',
    order: 1,
    certificateEnabled: true,
    portfolioReady: false,
    topics: ['Variables', 'Functions'],
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    __v: 7,
    user: { email: 'student@example.com' },
    ...overrides,
  };
}

function makeModule(overrides = {}) {
  return {
    _id: objectId('module-1'),
    pathId: objectId('path-1'),
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'First steps in the path.',
    order: 1,
    lessonCount: 2,
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    __v: 2,
    ...overrides,
  };
}

function makeLesson(overrides = {}) {
  return {
    _id: objectId('lesson-1'),
    moduleId: objectId('module-1'),
    pathId: objectId('path-1'),
    title: 'Variables',
    slug: 'variables',
    order: 1,
    contentFormat: 'markdown',
    content: '# Private lesson body',
    exampleCode: {
      language: 'javascript',
      code: 'const answer = 42;',
    },
    practice: {
      prompt: 'Private practice prompt',
      starterCode: 'const value = null;',
      hints: ['Private hint'],
      solutionOutline: 'Private solution',
    },
    durationMinutes: 20,
    topic: 'Variables',
    hasQuiz: true,
    questions: [
      {
        prompt: 'Private question',
        correctKey: 'A',
        explanation: 'Private explanation',
      },
    ],
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    __v: 3,
    user: { email: 'student@example.com' },
    ...overrides,
  };
}

module.exports = {
  makeLesson,
  makeModule,
  makePath,
  makeQueryResult,
};
