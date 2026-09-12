const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const CodingExercise = require('../models/CodingExercise');
const Resource = require('../models/Resource');

async function countPublished(model) {
  const [published, unpublished] = await Promise.all([
    model.countDocuments({ isPublished: true }),
    model.countDocuments({ isPublished: false }),
  ]);
  return { published, unpublished };
}

async function getOverview(req, res) {
  try {
    const [students, instructors, admins, learningPaths, lessons, quizzes, codingExercises, resources] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      countPublished(LearningPath),
      countPublished(Lesson),
      countPublished(Quiz),
      countPublished(CodingExercise),
      countPublished(Resource),
    ]);
    return res.json({
      users: { total: students + instructors + admins, student: students, instructor: instructors, admin: admins },
      content: { learningPaths, lessons, quizzes, codingExercises, resources },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ error: 'Could not load admin overview.' });
  }
}

module.exports = { getOverview };