const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/careerPlanController');

const router = express.Router();
router.get('/', auth, controller.getPlan);
router.post('/', auth, controller.savePlan);
module.exports = router;
