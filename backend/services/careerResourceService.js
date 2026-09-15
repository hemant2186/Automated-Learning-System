const CareerResource = require('../models/CareerResource');

async function listCareerResources(careerSlug, skillKey) {
  const filter = { careerSlug, isPublished: true };
  if (skillKey) filter.skillKey = skillKey;
  return CareerResource.find(filter).sort({ skillKey: 1, rank: 1 }).lean();
}

module.exports = { listCareerResources };
