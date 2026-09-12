const express = require('express');
const resourceController = require('../controllers/resourceController');

const router = express.Router();

router.get('/path/:pathSlug', resourceController.listResourcesByPath);
router.get('/', resourceController.listResources);

module.exports = router;
