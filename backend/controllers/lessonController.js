const LearningPath = require('../models/LearningPath');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const lessonService = require('../services/lessonService');
const UserProgress = require('../models/UserProgress');

function lessonMeta(lesson, moduleOrder) {
  return {
    id: lesson._id.toString(), title: lesson.title, slug: lesson.slug,
    order: lesson.order, durationMinutes: lesson.durationMinutes,
    hasQuiz: Boolean(lesson.hasQuiz), hasCodeExercise: Boolean(lesson.hasCodeExercise),
  };
}

async function listLessonsByPath(req, res) {
  try {
    const path = await LearningPath.findOne({ slug: req.params.pathSlug.trim().toLowerCase(), isPublished: true })
      .select('title slug').lean();
    if (!path) return res.status(404).json({ error: 'Learning path not found.' });

    const [modules, lessons] = await Promise.all([
      Module.find({ pathId: path._id, isPublished: true }).select('title slug order').sort({ order: 1 }).lean(),
      Lesson.find({ pathId: path._id, isPublished: true }).select('moduleId title slug order durationMinutes hasQuiz hasCodeExercise').lean(),
    ]);
    const lessonsByModule = new Map();
    lessons.forEach((lesson) => {
      const module = modules.find((moduleDoc) => moduleDoc._id.toString() === lesson.moduleId.toString());
      if (!module) return;
      const items = lessonsByModule.get(module._id.toString()) || [];
      items.push(lessonMeta(lesson, module.order));
      lessonsByModule.set(module._id.toString(), items);
    });

    return res.json({
      path: { title: path.title, slug: path.slug },
      modules: modules.map((module) => ({
        title: module.title, slug: module.slug, order: module.order,
        lessons: (lessonsByModule.get(module._id.toString()) || []).sort((a, b) => a.order - b.order),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not load lessons.' });
  }
}

async function getLessonBySlug(req, res) {
  try {
    const path = await LearningPath.findOne({ slug: req.params.pathSlug.trim().toLowerCase(), isPublished: true })
      .select('title slug').lean();
    if (!path) return res.status(404).json({ error: 'Learning path not found.' });

    const lesson = await Lesson.findOne({
      pathId: path._id, slug: req.params.lessonSlug.trim().toLowerCase(), isPublished: true,
    }).select('title slug order contentFormat content exampleCode practice durationMinutes topic hasQuiz hasCodeExercise moduleId').lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const module = await Module.findOne({ _id: lesson.moduleId, isPublished: true }).select('title slug order').lean();
    if (!module) return res.status(404).json({ error: 'Lesson module not found.' });

    // A lesson is considered viewed when its read-only content endpoint is opened.
    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, lessonId: lesson._id, type: 'lesson' },
      { $set: { userId: req.user._id, pathId: path._id, moduleId: lesson.moduleId, lessonId: lesson._id, type: 'lesson', topic: lesson.topic } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const [modules, lessons] = await Promise.all([
      Module.find({ pathId: path._id, isPublished: true }).select('_id order').lean(),
      Lesson.find({ pathId: path._id, isPublished: true }).select('title slug order moduleId').lean(),
    ]);
    const moduleOrder = new Map(modules.map((item) => [item._id.toString(), item.order]));
    const orderedLessons = lessons.sort((a, b) => (
      moduleOrder.get(a.moduleId.toString()) - moduleOrder.get(b.moduleId.toString()) || a.order - b.order
    ));
    const index = orderedLessons.findIndex((item) => item.slug === lesson.slug);

    return res.json({
      id: lesson._id.toString(), title: lesson.title, slug: lesson.slug, order: lesson.order,
      durationMinutes: lesson.durationMinutes, contentFormat: lesson.contentFormat, content: lesson.content,
      exampleCode: lesson.exampleCode || { language: '', code: '' },
      practice: lesson.practice || { prompt: '', hints: [] }, topic: lesson.topic,
      hasQuiz: Boolean(lesson.hasQuiz), hasCodeExercise: Boolean(lesson.hasCodeExercise),
      path: { title: path.title, slug: path.slug },
      module: { title: module.title, slug: module.slug, order: module.order },
      previousLesson: index > 0 ? { title: orderedLessons[index - 1].title, slug: orderedLessons[index - 1].slug } : null,
      nextLesson: index >= 0 && index < orderedLessons.length - 1
        ? { title: orderedLessons[index + 1].title, slug: orderedLessons[index + 1].slug } : null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not load lesson content.' });
  }
}

async function getLegacyLessonBySlug(req, res) {
  try {
    const lesson = await lessonService.getLessonBySlug(req.params.slug);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    return res.json(lesson);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not load lesson content.' });
  }
}

module.exports = { listLessonsByPath, getLessonBySlug, getLegacyLessonBySlug };
