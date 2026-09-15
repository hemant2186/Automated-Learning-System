const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/careerPortfolioController');

const router = express.Router();

router.get('/', auth, controller.getPortfolio);
router.put('/profile', auth, controller.saveProfile);
router.get('/resume', auth, controller.getResume);

module.exports = router;
