const express = require('express');
const auth = require('../middleware/auth');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.get('/:lessonSlug', auth, quizController.getQuiz);
router.post('/:lessonSlug/submit', auth, quizController.submitQuiz);
router.get('/:lessonSlug/results', auth, quizController.getQuizResults);

module.exports = router;
