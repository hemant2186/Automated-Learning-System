const service = require('../services/jobMatchingService');

async function analyze(req, res) {
  try {
    const data = await service.analyzeJob(req.user.id, req.body || {});
    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Could not analyze the job.' });
  }
}

async function list(req, res) {
  try {
    const data = await service.listJobs(req.user.id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load saved jobs.' });
  }
}

async function getOne(req, res) {
  try {
    const data = await service.getJob(req.user.id, req.params.id);
    if (!data) return res.status(404).json({ error: 'Job analysis not found.' });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load the job analysis.' });
  }
}

module.exports = { analyze, list, getOne };
