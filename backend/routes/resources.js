const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'resources',
    message: 'Resource center API will be available in a future release.',
  });
});

module.exports = router;
