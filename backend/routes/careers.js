const express = require('express');
const controller = require('../controllers/careerController');

const router = express.Router();

router.get('/', controller.listCareers);
router.get('/:slug', controller.getCareer);

module.exports = router;
