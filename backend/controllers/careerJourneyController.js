const service = require('../services/careerJourneyService');

async function getJourney(req, res) {
  try {
    const result = await service.getJourney(req.user._id);
    return res.json(result || { plan: null, journey: null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load career journey.' });
  }
}

async function completeStage(req, res) {
  try {
    const result = await service.updateStage(req.user._id, String(req.params.skillKey).toLowerCase(), req.params.stage);
    return res.json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || 'Could not update journey.' });
  }
}

module.exports = { getJourney, completeStage };
