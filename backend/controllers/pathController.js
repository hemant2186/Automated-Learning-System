const pathService = require('../services/pathService');

async function listPaths(req, res) {
  try {
    const result = await pathService.listPublishedPaths();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Could not load learning paths.' });
  }
}

async function getPathBySlug(req, res) {
  try {
    const path = await pathService.getPathStructureBySlug(req.params.slug);

    if (!path) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }

    res.json(path);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Could not load the learning path.',
    });
  }
}

module.exports = {
  listPaths,
  getPathBySlug,
};
