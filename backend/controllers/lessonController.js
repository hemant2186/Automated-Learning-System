const { getLessonBySlug } = require('../services/lessonService');

async function getLessonBySlugHandler(req, res) {
  try {
    const lesson = await getLessonBySlug(req.params.slug);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    return res.json(lesson);
  } catch (error) {
    if (error && error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Lesson controller error:', error);
    return res.status(500).json({ error: 'Could not load lesson content.' });
  }
}

module.exports = {
  getLessonBySlug: getLessonBySlugHandler,
};
