const catalogService = require('../services/catalogService');

async function listCatalog(req, res) {
  try {
    const result = await catalogService.getCatalog(req.query);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Could not load the learning path catalog.',
    });
  }
}

module.exports = {
  listCatalog,
};
