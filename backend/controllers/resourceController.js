const Resource = require('../models/Resource');
const LearningPath = require('../models/LearningPath');

const RESOURCE_FIELDS = 'title slug description url type category programmingLanguage difficulty tags pathId lessonId isExternal';

function toResourceDto(resource) {
  return {
    id: resource._id.toString(),
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    url: resource.url,
    type: resource.type,
    category: resource.category,
    programmingLanguage: resource.programmingLanguage,
    difficulty: resource.difficulty,
    tags: resource.tags || [],
    pathId: resource.pathId ? resource.pathId.toString() : null,
    lessonId: resource.lessonId ? resource.lessonId.toString() : null,
    isExternal: resource.isExternal,
  };
}

function buildResourceQuery(query = {}) {
  const filters = { isPublished: true };
  ['category', 'type', 'difficulty'].forEach((field) => {
    if (query[field]) filters[field] = query[field];
  });
  if (query.tag) filters.tags = query.tag;
  if (query.search) filters.$text = { $search: query.search.trim() };
  return filters;
}

async function listResources(req, res) {
  try {
    const resources = await Resource.find(buildResourceQuery(req.query))
      .select(RESOURCE_FIELDS)
      .sort({ title: 1 })
      .lean();
    return res.json({ items: resources.map(toResourceDto), total: resources.length });
  } catch (error) {
    console.error('Resource list error:', error);
    return res.status(500).json({ error: 'Could not load resources.' });
  }
}

async function listResourcesByPath(req, res) {
  try {
    const path = await LearningPath.findOne({ slug: req.params.pathSlug.trim().toLowerCase(), isPublished: true })
      .select('_id slug').lean();
    if (!path) return res.status(404).json({ error: 'Learning path not found.' });

    const resources = await Resource.find({ ...buildResourceQuery(req.query), pathId: path._id })
      .select(RESOURCE_FIELDS)
      .sort({ title: 1 })
      .lean();
    return res.json({ pathSlug: path.slug, items: resources.map(toResourceDto), total: resources.length });
  } catch (error) {
    console.error('Path resource list error:', error);
    return res.status(500).json({ error: 'Could not load learning path resources.' });
  }
}

module.exports = { listResources, listResourcesByPath, toResourceDto };