const express = require('express');
const auth = require('../middleware/auth');
const { withCareerEvidence } = require('../middleware/careerEvidence');
const codeExerciseController = require('../controllers/codeExerciseController');

const router = express.Router();

router.get('/lesson/:lessonId', auth, codeExerciseController.getExerciseByLesson);
router.post('/:exerciseId/submit', auth, withCareerEvidence('code', codeExerciseController.submitCode));

module.exports = router;