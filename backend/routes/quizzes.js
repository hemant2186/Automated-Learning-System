const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'quizzes',
    message: 'Quiz API will be available in a future release.',
  });
});

module.exports = router;
