const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/careerController');
const planController = require('../controllers/careerPlanController');

const router = express.Router();

router.get('/', controller.listCareers);
router.get('/me/plan', auth, planController.getPlan);
router.post('/me/plan', auth, planController.savePlan);
router.get('/:slug', controller.getCareer);

module.exports = router;
