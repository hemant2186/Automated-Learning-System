const express = require('express');
const lessonController = require('../controllers/lessonController');

const router = express.Router();

router.get('/:slug', lessonController.getLessonBySlug);

module.exports = router;
