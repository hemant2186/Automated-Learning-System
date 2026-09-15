const service = require('../services/careerPortfolioService');

async function getPortfolio(req, res) {
  try {
    const portfolio = await service.getPortfolio(req.user._id);
    return res.json(portfolio || { portfolio: null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load portfolio.' });
  }
}

async function saveProfile(req, res) {
  try {
    const profile = await service.saveProfile(req.user._id, req.body || {});
    return res.json(profile);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Could not save career profile.' });
  }
}

async function getResume(req, res) {
  try {
    const resume = await service.getResume(req.user._id);
    return res.json(resume || { resume: null });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not generate resume.' });
  }
}

module.exports = { getPortfolio, saveProfile, getResume };
