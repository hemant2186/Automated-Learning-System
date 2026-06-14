const quizService = require('../services/quizService');

function handleControllerError(res, error, fallbackMessage) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error('Quiz controller error:', error);
  return res.status(500).json({ error: fallbackMessage });
}

async function getQuizHandler(req, res) {
  try {
    const quiz = await quizService.fetchQuiz(req.user._id, req.params.lessonSlug);
    return res.json(quiz);
  } catch (error) {
    return handleControllerError(res, error, 'Could not load quiz.');
  }
}

async function submitQuizHandler(req, res) {
  try {
    const result = await quizService.submitQuiz(
      req.user._id,
      req.params.lessonSlug,
      req.body?.answers
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(res, error, 'Could not submit quiz.');
  }
}

async function getQuizResultsHandler(req, res) {
  try {
    const result = await quizService.fetchLatestResult(req.user._id, req.params.lessonSlug);
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, error, 'Could not load quiz result.');
  }
}

module.exports = {
  getQuiz: getQuizHandler,
  submitQuiz: submitQuizHandler,
  getQuizResults: getQuizResultsHandler,
};
