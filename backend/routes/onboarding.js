const express = require('express');
const auth = require('../middleware/auth');
const onboardingController = require('../controllers/onboardingController');

const router = express.Router();

router.get('/', auth, onboardingController.getOnboarding);
router.post('/', auth, onboardingController.completeOnboarding);

module.exports = router;
