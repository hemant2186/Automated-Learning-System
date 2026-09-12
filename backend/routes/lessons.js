const express = require('express');
const auth = require('../middleware/auth');
const lessonController = require('../controllers/lessonController');

const router = express.Router();

router.get('/path/:pathSlug', auth, lessonController.listLessonsByPath);
router.get('/:pathSlug/:lessonSlug', auth, lessonController.getLessonBySlug);
router.get('/:slug', lessonController.getLegacyLessonBySlug);

module.exports = router;
