const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'progress',
    message: 'User progress API will be available in a future release.',
  });
});

module.exports = router;
