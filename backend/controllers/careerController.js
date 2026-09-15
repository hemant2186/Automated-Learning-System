const Career = require('../models/Career');

async function listCareers(req, res) {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    const careers = await Career.find(filter)
      .select('title slug description category difficulty estimatedWeeks targetRoles skills linkedLearningPaths')
      .sort({ category: 1, title: 1 })
      .lean();

    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not load careers.' });
  }
}

async function getCareer(req, res) {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!career) {
      return res.status(404).json({ error: 'Career not found.' });
    }
    return res.json(career);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load career.' });
  }
}

module.exports = { listCareers, getCareer };
