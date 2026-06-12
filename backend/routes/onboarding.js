const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'onboarding',
    message: 'Onboarding API will be available in a future release.',
  });
});

module.exports = router;
