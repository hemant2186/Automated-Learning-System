const express = require('express');
const auth = require('../middleware/auth');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.get('/lesson/:lessonId', auth, quizController.getQuiz);
router.post('/:quizId/submit', auth, quizController.submitQuiz);
router.get('/:lessonSlug', auth, quizController.getLegacyQuiz);
router.post('/:lessonSlug/submit', auth, quizController.submitLegacyQuiz);
router.get('/:lessonSlug/results', auth, quizController.getLegacyQuizResults);

module.exports = router;
