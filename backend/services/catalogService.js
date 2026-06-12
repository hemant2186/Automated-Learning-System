const LearningPath = require('../models/LearningPath');
const { PATH_CATEGORIES, DIFFICULTY_LEVELS } = require('../models/constants/contentEnums');

const CATALOG_FIELDS = [
  'title',
  'slug',
  'description',
  'category',
  'difficulty',
  'estimatedHours',
  'lessonCount',
  'quizCount',
  'projectCount',
  'tags',
  'icon',
  'order',
].join(' ');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCatalogItem(path) {
  return {
    id: path._id.toString(),
    title: path.title,
    slug: path.slug,
    description: path.description,
    category: path.category,
    difficulty: path.difficulty,
    estimatedHours: path.estimatedHours,
    lessonCount: path.lessonCount,
    quizCount: path.quizCount,
    projectCount: path.projectCount,
    tags: path.tags || [],
    icon: path.icon,
    order: path.order,
  };
}

function buildCatalogFilter({ category, difficulty, search }) {
  const filter = { isPublished: true };

  if (category) {
    filter.category = category;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (search && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { title: pattern },
      { description: pattern },
      { slug: pattern },
      { tags: pattern },
    ];
  }

  return filter;
}

function buildCatalogSort(sort) {
  switch (sort) {
    case 'title':
      return { title: 1 };
    case 'newest':
      return { createdAt: -1 };
    case 'order':
    default:
      return { order: 1, title: 1 };
  }
}

function validateCatalogQuery({ category, difficulty, sort }) {
  if (category && !PATH_CATEGORIES.includes(category)) {
    return 'Invalid category filter.';
  }

  if (difficulty && !DIFFICULTY_LEVELS.includes(difficulty)) {
    return 'Invalid difficulty filter.';
  }

  if (sort && !['order', 'title', 'newest'].includes(sort)) {
    return 'Invalid sort value.';
  }

  return null;
}

async function getCatalog(query = {}) {
  const category = typeof query.category === 'string' ? query.category.trim() : '';
  const difficulty = typeof query.difficulty === 'string' ? query.difficulty.trim() : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sort = typeof query.sort === 'string' ? query.sort.trim() : 'order';

  const validationError = validateCatalogQuery({
    category: category || undefined,
    difficulty: difficulty || undefined,
    sort,
  });

  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const filter = buildCatalogFilter({
    category: category || undefined,
    difficulty: difficulty || undefined,
    search,
  });

  const paths = await LearningPath.find(filter)
    .select(CATALOG_FIELDS)
    .sort(buildCatalogSort(sort))
    .lean();

  return {
    items: paths.map(toCatalogItem),
    total: paths.length,
    filters: {
      category: category || null,
      difficulty: difficulty || null,
      search,
      sort,
    },
  };
}

module.exports = {
  getCatalog,
  toCatalogItem,
  validateCatalogQuery,
};
