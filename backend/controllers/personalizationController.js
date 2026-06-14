const personalizationService = require('../services/personalizationService');

async function getPersonalizationHandler(req, res) {
  try {
    const dto = await personalizationService.getPersonalizationForUser(req.user._id);
    if (!dto) {
      return res.status(204).end();
    }
    res.json(dto);
  } catch (e) {
    console.error('Personalization error:', e);
    res.status(500).json({ error: 'Could not generate personalization.' });
  }
}

module.exports = { getPersonalizationHandler };
