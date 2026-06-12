const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'lessons',
    message: 'Lesson content API will be available in a future release.',
  });
});

module.exports = router;
