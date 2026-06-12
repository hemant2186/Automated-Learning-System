const LearningPath = require('../models/LearningPath');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

const PATH_SUMMARY_FIELDS = [
  'title',
  'slug',
  'description',
  'category',
  'difficulty',
  'estimatedHours',
  'lessonCount',
  'quizCount',
  'projectCount',
  'resourceCount',
  'tags',
  'icon',
  'order',
  'certificateEnabled',
  'portfolioReady',
].join(' ');

const PATH_DETAIL_FIELDS = [
  'title',
  'slug',
  'description',
  'category',
  'difficulty',
  'estimatedHours',
  'lessonCount',
  'quizCount',
  'projectCount',
  'resourceCount',
  'tags',
  'icon',
  'order',
  'topics',
  'certificateEnabled',
  'portfolioReady',
].join(' ');

const MODULE_FIELDS = 'title slug description order lessonCount';
const LESSON_META_FIELDS = 'moduleId title slug durationMinutes hasQuiz topic order';

function toPathSummary(path) {
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
    resourceCount: path.resourceCount,
    tags: path.tags || [],
    icon: path.icon,
    order: path.order,
    certificateEnabled: path.certificateEnabled,
    portfolioReady: path.portfolioReady,
  };
}

function toLessonMeta(lesson) {
  return {
    id: lesson._id.toString(),
    title: lesson.title,
    slug: lesson.slug,
    durationMinutes: lesson.durationMinutes,
    hasQuiz: lesson.hasQuiz,
    topic: lesson.topic,
    order: lesson.order,
  };
}

async function listPublishedPaths() {
  const paths = await LearningPath.find({ isPublished: true })
    .select(PATH_SUMMARY_FIELDS)
    .sort({ order: 1, title: 1 })
    .lean();

  return {
    items: paths.map(toPathSummary),
    total: paths.length,
  };
}

async function getPathStructureBySlug(slug) {
  const normalizedSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';

  if (!normalizedSlug) {
    const error = new Error('Path slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const path = await LearningPath.findOne({ slug: normalizedSlug, isPublished: true })
    .select(PATH_DETAIL_FIELDS)
    .lean();

  if (!path) {
    return null;
  }

  const [modules, lessons] = await Promise.all([
    Module.find({ pathId: path._id, isPublished: true })
      .select(MODULE_FIELDS)
      .sort({ order: 1 })
      .lean(),
    Lesson.find({ pathId: path._id, isPublished: true })
      .select(LESSON_META_FIELDS)
      .sort({ order: 1 })
      .lean(),
  ]);

  const lessonsByModuleId = new Map();

  lessons.forEach((lesson) => {
    const moduleKey = lesson.moduleId.toString();
    if (!lessonsByModuleId.has(moduleKey)) {
      lessonsByModuleId.set(moduleKey, []);
    }
    lessonsByModuleId.get(moduleKey).push(toLessonMeta(lesson));
  });

  lessonsByModuleId.forEach((moduleLessons) => {
    moduleLessons.sort((left, right) => left.order - right.order);
  });

  return {
    ...toPathSummary(path),
    topics: path.topics || [],
    modules: modules.map((moduleDoc) => ({
      id: moduleDoc._id.toString(),
      title: moduleDoc.title,
      slug: moduleDoc.slug,
      description: moduleDoc.description,
      order: moduleDoc.order,
      lessonCount: moduleDoc.lessonCount,
      lessons: lessonsByModuleId.get(moduleDoc._id.toString()) || [],
    })),
  };
}

module.exports = {
  listPublishedPaths,
  getPathStructureBySlug,
  toPathSummary,
  toLessonMeta,
};
