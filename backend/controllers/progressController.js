const progressService = require('../services/progressService');

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
  getUserPathOverview: getUserPathOverviewHandler,
  getPathEnrollment: getPathEnrollmentHandler,
  enrollInPath: enrollInPathHandler,
  completeLesson: completeLessonHandler,
};