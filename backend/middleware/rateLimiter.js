const rateLimit = require('express-rate-limit');

const handler = (req, res) => {
  res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { authLimiter, demoLimiter };