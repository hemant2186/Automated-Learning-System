const express = require('express');
const resourceController = require('../controllers/resourceController');
const careerResourceController = require('../controllers/careerResourceController');

const router = express.Router();

router.get('/career/:careerSlug', careerResourceController.list);
router.get('/path/:pathSlug', resourceController.listResourcesByPath);
router.get('/', resourceController.listResources);

module.exports = router;
