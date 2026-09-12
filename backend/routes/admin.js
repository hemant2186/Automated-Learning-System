const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

router.get('/overview', adminController.getOverview);

module.exports = router;
