const service = require('../services/careerPlanService');

async function getPlan(req, res) {
  try {
    const plan = await service.getPlanForUser(req.user._id);
    return res.json(plan || { plan: null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load career plan.' });
  }
}

async function savePlan(req, res) {
  try {
    const plan = await service.createOrUpdatePlan(req.user._id, req.body || {});
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || 'Could not save career plan.' });
  }
}

module.exports = { getPlan, savePlan };
