const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    resource: 'admin',
    message: 'Admin content management API will be available in a future release.',
  });
});

module.exports = router;
