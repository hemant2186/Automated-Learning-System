const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const allowedRoles = ['student', 'instructor', 'admin'];
const allowedSkillLevels = ['beginner', 'intermediate', 'advanced'];

async function seedActivitiesForUser(user, items) {
  const Activity = require('../models/Activity');
  const existingCount = await Activity.countDocuments({ user: user._id });
  if (existingCount > 0) {
    return;
  }

  const activityDocs = items.map((item) => ({
    ...item,
    user: user._id,
    pointsEarned: (item.quizScore || 0) + (item.codingScore || 0),
  }));

  await Activity.insertMany(activityDocs);
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
    await seedActivitiesForUser(user, [
      {
        topic: 'Computer Basics',
        quizScore: 82,
        codingScore: 76,
        timeSpent: 18,
        attempts: 1,
        completed: true,
        feedback: 'Getting comfortable with the editor and terminal.',
      },
      {
        topic: 'Variables and Data Types',
        quizScore: 74,
        codingScore: 70,
        timeSpent: 24,
        attempts: 2,
        completed: true,
        feedback: 'Type conversion still feels a little confusing.',
      },
      {
        topic: 'Loops',
        quizScore: 62,
        codingScore: 58,
        timeSpent: 28,
        attempts: 3,
        completed: false,
        feedback: 'Loop conditions and counters are the hardest part right now.',
      },
    ]);
  } else {
    const demoStudents = [
      {
        name: 'Asha Rao',
        email: 'asha.demo@pathpilot.dev',
        skillLevel: 'beginner',
      },
      {
        name: 'Rohan Mehta',
        email: 'rohan.demo@pathpilot.dev',
        skillLevel: 'intermediate',
      },
    ];

    for (const studentConfig of demoStudents) {
      let student = await User.findOne({ email: studentConfig.email });
      if (!student) {
        const hashedPassword = await bcrypt.hash('Password123', 8);
        student = await User.create({
          ...studentConfig,
          password: hashedPassword,
          role: 'student',
          goals: ['projects', 'stronger fundamentals'],
        });
      }

      await seedActivitiesForUser(student, [
        {
          topic: 'Variables and Data Types',
          quizScore: studentConfig.skillLevel === 'beginner' ? 68 : 84,
          codingScore: studentConfig.skillLevel === 'beginner' ? 64 : 80,
          timeSpent: 20,
          attempts: 2,
          completed: true,
          feedback: 'Building consistency with foundational syntax.',
        },
        {
          topic: studentConfig.skillLevel === 'beginner' ? 'Loops' : 'Functions',
          quizScore: studentConfig.skillLevel === 'beginner' ? 54 : 77,
          codingScore: studentConfig.skillLevel === 'beginner' ? 49 : 74,
          timeSpent: 27,
          attempts: studentConfig.skillLevel === 'beginner' ? 3 : 2,
          completed: studentConfig.skillLevel !== 'beginner',
          feedback: 'Needs a little more guided reinforcement on the current focus topic.',
        },
      ]);
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
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
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

router.post('/login', async (req, res) => {
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

router.post('/demo-session', async (req, res) => {
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
