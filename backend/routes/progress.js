const express = require('express');
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

const router = express.Router();

router.get('/', auth, progressController.getUserPathOverview);
router.get('/:slug', auth, progressController.getPathEnrollment);
router.post('/:slug/enroll', auth, progressController.enrollInPath);
router.post('/lessons/:lessonSlug/complete', auth, progressController.completeLesson);

module.exports = router;
