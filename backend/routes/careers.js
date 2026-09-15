const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/careerController');
const planController = require('../controllers/careerPlanController');
const journeyController = require('../controllers/careerJourneyController');
const proofController = require('../controllers/careerProofController');
const readinessController = require('../controllers/careerReadinessController');
const resourceController = require('../controllers/careerResourceController');
const jobMatchController = require('../controllers/jobMatchController');

const router = express.Router();

router.get('/', controller.listCareers);
router.get('/me/plan', auth, planController.getPlan);
router.post('/me/plan', auth, planController.savePlan);
router.get('/me/journey', auth, journeyController.getJourney);
router.post('/me/journey/:skillKey/:stage/complete', auth, journeyController.completeStage);
router.get('/me/readiness', auth, readinessController.getReadiness);
router.post('/me/proof', auth, proofController.createProof);
router.post('/me/jobs/analyze', auth, jobMatchController.analyze);
router.get('/me/jobs', auth, jobMatchController.list);
router.get('/me/jobs/:id', auth, jobMatchController.getOne);
router.get('/:slug/resources', resourceController.list);
router.get('/:slug', controller.getCareer);

module.exports = router;
