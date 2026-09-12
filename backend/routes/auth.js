const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authLimiter, demoLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const allowedRoles = ['student', 'instructor', 'admin'];
const allowedSkillLevels = ['beginner', 'intermediate', 'advanced'];

async function seedActivitiesForUser(user, items) {
  const Activity = require('../models/Activity');
  const existingCount = await Activity.countDocuments({ user: user._id });
  if (existingCount > 0) {
    return false;
  }

  const activityDocs = items.map((item) => ({
    ...item,
    user: user._id,
    pointsEarned: Math.round(((item.quizScore || 0) + (item.codingScore || 0)) / 2) + (item.completed ? 10 : 0),
  }));

  await Activity.insertMany(activityDocs);
  return true;
}

async function seedAssessmentHistory(user, profile) {
  const Lesson = require('../models/Lesson');
  const Quiz = require('../models/Quiz');
  const QuizAttempt = require('../models/QuizAttempt');
  const CodingExercise = require('../models/CodingExercise');
  const CodeSubmission = require('../models/CodeSubmission');

  const lesson = await Lesson.findOne({ slug: profile.lessonSlug, isPublished: true }).lean();
  if (!lesson) return;

  const createdAt = new Date(Date.now() - profile.daysAgo * 24 * 60 * 60 * 1000);
  const quiz = await Quiz.findOne({ lessonId: lesson._id, isPublished: true }).lean();
  if (quiz) {
    await QuizAttempt.create({
      userId: user._id,
      quizId: quiz._id,
      lessonId: lesson._id,
      pathId: lesson.pathId,
      answers: [],
      score: profile.quizScore,
      correct: 0,
      total: quiz.questions.length,
      passed: profile.quizScore >= quiz.passingScore,
      attemptNumber: profile.attempts,
      completedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const exercise = await CodingExercise.findOne({ lessonId: lesson._id, isPublished: true }).lean();
  if (exercise) {
    await CodeSubmission.create({
      userId: user._id,
      exerciseId: exercise._id,
      lessonId: lesson._id,
      pathId: lesson.pathId,
      code: exercise.starterCode || '# demo submission',
      language: exercise.language,
      testResults: [],
      score: profile.codingScore,
      passed: profile.codingScore === 100,
      attemptNumber: profile.attempts,
      createdAt,
      updatedAt: createdAt,
    });
  }
}

async function getOrCreateDemoUser(role = 'student') {
  const demoConfig = role === 'instructor'
    ? {
        name: 'Demo Instructor',
        email: 'demo.instructor@pathpilot.dev',
        password: 'Password123',
        role: 'instructor',
        skillLevel: 'advanced',
        goals: ['cohort visibility', 'early intervention'],
        preferences: { dashboardMode: 'instructor' },
      }
    : {
        name: 'Demo Student',
        email: 'demo.student@pathpilot.dev',
        password: 'Password123',
        role: 'student',
        skillLevel: 'beginner',
        goals: ['python basics', 'debugging confidence'],
        preferences: { focusMode: 'Hands-on coding' },
      };

  let user = await User.findOne({ email: demoConfig.email });

  if (!user) {
    const hashedPassword = await bcrypt.hash(demoConfig.password, 8);
    user = await User.create({
      ...demoConfig,
      password: hashedPassword,
    });
  }

  if (role === 'student') {
    const history = [
      ['Computer Basics', 48, 42, 4, false, 21],
      ['Variables and Data Types', 56, 51, 3, false, 18],
      ['Loops', 61, 57, 3, false, 14],
      ['Operators', 68, 64, 2, true, 10],
      ['Functions', 74, 71, 2, true, 7],
      ['Arrays', 79, 76, 1, true, 4],
      ['Functions', 84, 82, 1, true, 2],
      ['Arrays', 89, 87, 1, true, 0],
    ].map(([topic, quizScore, codingScore, attempts, completed, daysAgo], index) => ({
      topic, quizScore, codingScore, timeSpent: 30 - Math.min(index, 10), attempts, completed,
      feedback: completed ? 'The latest practice felt more fluent.' : 'Needs another focused review session.',
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    }));
    const seeded = await seedActivitiesForUser(user, history);
    for (const item of seeded ? history.slice(0, 3) : []) {
      await seedAssessmentHistory(user, {
        lessonSlug: item.topic === 'Variables and Data Types' ? 'variables' : item.topic === 'Loops' ? 'loops' : 'operators',
        ...item,
        daysAgo: Math.round((Date.now() - item.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      });
    }
  } else {
    const demoStudents = [
      {
        name: 'Asha Rao',
        email: 'asha.demo@pathpilot.dev',
        skillLevel: 'beginner',
        history: [
          ['Computer Basics', 52, 48, 3, false, 24], ['Variables and Data Types', 61, 56, 2, true, 20],
          ['Operators', 67, 63, 2, true, 16], ['Control Structures', 72, 68, 2, true, 12],
          ['Loops', 77, 73, 1, true, 8], ['Functions', 82, 79, 1, true, 5],
          ['Arrays', 86, 83, 1, true, 2], ['Functions', 90, 88, 1, true, 0],
        ],
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan.demo@pathpilot.dev',
        skillLevel: 'intermediate',
        history: [
          ['Variables and Data Types', 38, 32, 4, false, 28], ['Loops', 34, 29, 4, false, 24],
          ['Functions', 41, 35, 3, false, 20], ['Operators', 39, 31, 3, false, 17],
          ['Control Structures', 43, 36, 3, false, 14], ['Arrays', 37, 30, 4, false, 12],
          ['Loops', 42, 35, 3, false, 10], ['Functions', 40, 34, 3, false, 9],
        ],
      },
      {
        name: 'Maya Chen',
        email: 'maya.demo@pathpilot.dev',
        skillLevel: 'beginner',
        history: [
          ['Computer Basics', 71, 68, 1, true, 2],
          ['Variables and Data Types', 68, 65, 1, true, 0],
        ],
      },
    ];

    for (const studentConfig of demoStudents) {
      const { history: studentHistory, ...studentFields } = studentConfig;
      let student = await User.findOne({ email: studentConfig.email });
      if (!student) {
        const hashedPassword = await bcrypt.hash('Password123', 8);
        student = await User.create({
          ...studentFields,
          password: hashedPassword,
          role: 'student',
          goals: ['projects', 'stronger fundamentals'],
        });
      }

      const history = studentHistory.map(([topic, quizScore, codingScore, attempts, completed, daysAgo]) => ({
        topic, quizScore, codingScore, timeSpent: 24, attempts, completed,
        feedback: completed ? 'Building consistency with foundational syntax.' : 'Needs guided reinforcement on this topic.',
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      }));
      const seeded = await seedActivitiesForUser(student, history);
      for (const item of seeded ? history.slice(0, 2) : []) {
        await seedAssessmentHistory(student, {
          lessonSlug: item.topic === 'Variables and Data Types' ? 'variables' : item.topic === 'Loops' ? 'loops' : 'what-is-python',
          ...item,
          daysAgo: Math.round((Date.now() - item.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
        });
      }
    }
  }

  return user;
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    skillLevel: user.skillLevel,
    goals: user.goals || [],
    preferences: user.preferences || {},
    points: user.points || 0,
    badges: user.badges || [],
    streak: user.streak || 0,
    createdAt: user.createdAt,
  };
}

function buildSessionPayload(user) {
  const access_token = jwt.sign(
    { id: user._id.toString(), type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const refresh_token = jwt.sign(
    { id: user._id.toString(), type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    user: serializeUser(user),
    access_token,
    refresh_token,
  };
}

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/[A-Za-z]/)
      .withMessage('Password must include at least one letter.')
      .matches(/[0-9]/)
      .withMessage('Password must include at least one number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const { name, email, password, role, skillLevel, goals } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 8);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: allowedRoles.includes(role) ? role : 'student',
        skillLevel: allowedSkillLevels.includes(skillLevel) ? skillLevel : 'beginner',
        goals: Array.isArray(goals) ? goals.filter(Boolean) : [],
      });

      await user.save();
      res.status(201).json(buildSessionPayload(user));
    } catch (error) {
      res.status(500).json({ error: 'Could not create your account right now.' });
    }
  }
);

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json(buildSessionPayload(user));
  } catch (error) {
    res.status(500).json({ error: 'Could not sign you in right now.' });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json(serializeUser(req.user));
});

router.put('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const { name, skillLevel, goals, preferences } = req.body;

    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (allowedSkillLevels.includes(skillLevel)) {
      updates.skillLevel = skillLevel;
    }

    if (Array.isArray(goals)) {
      updates.goals = goals.filter(Boolean);
    }

    if (preferences && typeof preferences === 'object') {
      updates.preferences = preferences;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(serializeUser(updatedUser));
  } catch (error) {
    res.status(400).json({ error: 'Could not update your profile right now.' });
  }
});

router.post('/demo-session', demoLimiter, async (req, res) => {
  try {
    const role = req.body?.role === 'instructor' ? 'instructor' : 'student';
    const user = await getOrCreateDemoUser(role);
    res.json(buildSessionPayload(user));
  } catch (error) {
    res.status(500).json({ error: 'Could not create a demo session right now.' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const authorization = req.header('Authorization');
    if (!authorization) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

    const refreshToken = authorization.replace('Bearer ', '');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Refresh token is invalid.' });
    }

    const access_token = jwt.sign(
      { id: user._id.toString(), type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ access_token });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token is invalid.' });
  }
});

module.exports = router;
