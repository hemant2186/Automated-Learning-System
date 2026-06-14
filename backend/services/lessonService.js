const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const LearningPath = require('../models/LearningPath');

const LESSON_FIELDS = [
  'title',
  'slug',
  'topic',
  'durationMinutes',
  'contentFormat',
  'content',
  'exampleCode',
  'practice.prompt',
  'practice.hints',
  'pathId',
  'moduleId',
].join(' ');

const MODULE_FIELDS = ['title', 'slug', 'order'].join(' ');
const PATH_FIELDS = ['title', 'slug'].join(' ');

function toLessonDto(lesson, path, module, previousLesson, nextLesson) {
  return {
    id: lesson._id.toString(),
    title: lesson.title,
    slug: lesson.slug,
    topic: lesson.topic,
    durationMinutes: lesson.durationMinutes,
    contentFormat: lesson.contentFormat,
    content: lesson.content,
    exampleCode: lesson.exampleCode || { language: '', code: '' },
    practice: {
      prompt: lesson.practice?.prompt || '',
      hints: lesson.practice?.hints || [],
    },
    path: {
      id: path._id.toString(),
      slug: path.slug,
      title: path.title,
    },
    module: {
      id: module._id.toString(),
      slug: module.slug,
      title: module.title,
    },
    previousLesson: previousLesson
      ? {
          title: previousLesson.title,
          slug: previousLesson.slug,
          pathSlug: path.slug,
        }
      : null,
    nextLesson: nextLesson
      ? {
          title: nextLesson.title,
          slug: nextLesson.slug,
          pathSlug: path.slug,
        }
      : null,
  };
}

function normalizeLessons(lessons) {
  return lessons
    .map((lesson) => ({
      id: lesson._id.toString(),
      moduleId: lesson.moduleId.toString(),
      title: lesson.title,
      slug: lesson.slug,
      order: lesson.order,
      moduleOrder: lesson.moduleOrder,
    }))
    .sort((a, b) => {
      if (a.moduleOrder !== b.moduleOrder) {
        return a.moduleOrder - b.moduleOrder;
      }
      return a.order - b.order;
    });
}

async function getLessonBySlug(slug) {
  const normalizedSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';

  if (!normalizedSlug) {
    const error = new Error('Lesson slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const lesson = await Lesson.findOne({ slug: normalizedSlug, isPublished: true })
    .select(LESSON_FIELDS)
    .lean();

  if (!lesson) {
    return null;
  }

  const [module, path] = await Promise.all([
    Module.findOne({ _id: lesson.moduleId, isPublished: true })
      .select(MODULE_FIELDS)
      .lean(),
    LearningPath.findOne({ _id: lesson.pathId, isPublished: true })
      .select(PATH_FIELDS)
      .lean(),
  ]);

  if (!module || !path) {
    return null;
  }

  const lessons = await Lesson.find({ pathId: lesson.pathId, isPublished: true })
    .select('slug title order moduleId')
    .lean();

  const moduleOrders = await Module.find({ pathId: lesson.pathId, isPublished: true })
    .select('order _id')
    .lean();

  const moduleOrderById = new Map(moduleOrders.map((moduleDoc) => [moduleDoc._id.toString(), moduleDoc.order]));

  const orderedLessons = normalizeLessons(
    lessons.map((lessonDoc) => ({
      ...lessonDoc,
      moduleOrder: moduleOrderById.get(lessonDoc.moduleId.toString()) || 0,
    }))
  );

  const currentIndex = orderedLessons.findIndex((item) => item.slug === normalizedSlug);
  const previousLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  return toLessonDto(lesson, path, module, previousLesson, nextLesson);
}

module.exports = {
  getLessonBySlug,
};
