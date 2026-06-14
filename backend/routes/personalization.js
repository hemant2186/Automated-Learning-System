const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/personalizationController');

const router = express.Router();

router.get('/', auth, controller.getPersonalizationHandler);

module.exports = router;
