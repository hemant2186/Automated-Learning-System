const Career = require('../models/Career');
const CareerResource = require('../models/CareerResource');

async function list(req, res) {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isPublished: true }).select('slug').lean();
    if (!career) return res.status(404).json({ error: 'Career not found.' });
    const filter = { careerSlug: career.slug, isPublished: true };
    if (req.query.skillKey) filter.skillKey = String(req.query.skillKey).toLowerCase();
    const items = await CareerResource.find(filter).sort({ skillKey: 1, rank: 1 }).lean();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not load career resources.' });
  }
}

module.exports = { list };
