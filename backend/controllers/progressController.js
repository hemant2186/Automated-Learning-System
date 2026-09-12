const progressService = require('../services/progressService');
const UserProgress = require('../models/UserProgress');
const LearningPath = require('../models/LearningPath');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const CodingExercise = require('../models/CodingExercise');

async function getProgressMeHandler(req, res) {
  try {
    const [paths, progress] = await Promise.all([
      LearningPath.find({ isPublished: true }).select('_id title slug lessonCount quizCount').sort({ order: 1 }).lean(),
      UserProgress.find({ userId: req.user._id }).select('pathId type completed').lean(),
    ]);

    const rows = await Promise.all(paths.map(async (path) => {
      const [totalLessons, totalQuizzes, totalCodeExercises] = await Promise.all([
        Number.isFinite(path.lessonCount) ? Promise.resolve(path.lessonCount) : Lesson.countDocuments({ pathId: path._id, isPublished: true }),
        Number.isFinite(path.quizCount) ? Promise.resolve(path.quizCount) : Quiz.countDocuments({ pathId: path._id, isPublished: true }),
        CodingExercise.countDocuments({ pathId: path._id, isPublished: true }),
      ]);
      const pathProgress = progress.filter((item) => item.pathId.toString() === path._id.toString() && item.completed);
      const lessonsCompleted = pathProgress.filter((item) => item.type === 'lesson').length;
      const quizzesPassed = pathProgress.filter((item) => item.type === 'quiz').length;
      const codeExercisesPassed = pathProgress.filter((item) => item.type === 'code-exercise').length;
      const totalUnits = totalLessons + totalQuizzes + totalCodeExercises;
      const completedUnits = lessonsCompleted + quizzesPassed + codeExercisesPassed;
      return {
        path: { id: path._id.toString(), title: path.title, slug: path.slug },
        lessonsCompleted, totalLessons, quizzesPassed, totalQuizzes,
        codeExercisesPassed, totalCodeExercises,
        percentComplete: totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0,
      };
    }));
    return res.json({ items: rows, total: rows.length });
  } catch (error) {
    console.error('Progress aggregation error:', error);
    return res.status(500).json({ error: 'Could not load progress.' });
  }
}

async function getUserPathOverviewHandler(req, res) {
  try {
    const result = await progressService.getUserPathOverview(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Progress overview error:', error);
    res.status(500).json({ error: 'Could not load progress overview.' });
  }
}

async function getPathEnrollmentHandler(req, res) {
  try {
    const result = await progressService.getPathEnrollmentBySlug(req.user._id, req.params.slug);
    if (!result) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }
    res.json(result);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Path enrollment error:', error);
    res.status(500).json({ error: 'Could not load enrollment status.' });
  }
}

async function enrollInPathHandler(req, res) {
  try {
    const result = await progressService.enrollUserInPath(req.user._id, req.params.slug);
    res.status(201).json(result);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Path enroll error:', error);
    res.status(500).json({ error: 'Could not enroll in the learning path.' });
  }
}

async function completeLessonHandler(req, res) {
  try {
    const result = await progressService.markLessonComplete(req.user._id, req.params.lessonSlug);
    res.status(200).json(result);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Lesson completion error:', error);
    res.status(500).json({ error: 'Could not complete lesson.' });
  }
}

module.exports = {
  getProgressMe: getProgressMeHandler,
  getUserPathOverview: getUserPathOverviewHandler,
  getPathEnrollment: getPathEnrollmentHandler,
  enrollInPath: enrollInPathHandler,
  completeLesson: completeLessonHandler,
};