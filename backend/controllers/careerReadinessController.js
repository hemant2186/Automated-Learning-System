const service = require('../services/careerReadinessService');

async function getReadiness(req, res) {
  try {
    const readiness = await service.getReadiness(req.user._id);
    return res.json(readiness || { readiness: null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not calculate career readiness.' });
  }
}

module.exports = { getReadiness };
