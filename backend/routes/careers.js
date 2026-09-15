const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/careerController');
const planController = require('../controllers/careerPlanController');
const journeyController = require('../controllers/careerJourneyController');
const proofController = require('../controllers/careerProofController');
const resourceController = require('../controllers/careerResourceController');

const router = express.Router();

router.get('/', controller.listCareers);
router.get('/me/plan', auth, planController.getPlan);
router.post('/me/plan', auth, planController.savePlan);
router.get('/me/journey', auth, journeyController.getJourney);
router.post('/me/journey/:skillKey/:stage/complete', auth, journeyController.completeStage);
router.post('/me/proof', auth, proofController.createProof);
router.get('/:slug/resources', resourceController.list);
router.get('/:slug', controller.getCareer);

module.exports = router;
