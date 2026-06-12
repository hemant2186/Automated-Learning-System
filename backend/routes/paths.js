const express = require('express');
const pathController = require('../controllers/pathController');

const router = express.Router();

router.get('/', pathController.listPaths);
router.get('/:slug', pathController.getPathBySlug);

module.exports = router;
