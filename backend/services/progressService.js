const LearningPath = require('../models/LearningPath');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const UserPath = require('../models/UserPath');
const UserProgress = require('../models/UserProgress');

function normalizeSlug(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

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

function toUserPathDto(userPath, path, currentLesson) {
  return {
    id: userPath._id.toString(),
    status: userPath.status,
    progressPercent: Number(userPath.progressPercent || 0),
    currentLesson: currentLesson
      ? {
          id: currentLesson._id.toString(),
          title: currentLesson.title,
          slug: currentLesson.slug,
        }
      : null,
    enrolledAt: userPath.enrolledAt,
    startedAt: userPath.startedAt,
    lastAccessedAt: userPath.lastAccessedAt,
    completedAt: userPath.completedAt,
    path: toPathSummary(path),
  };
}

async function getFirstPublishedLesson(pathId) {
  const modules = await Module.find({ pathId, isPublished: true })
    .select('_id order')
    .sort({ order: 1 })
    .lean();

  for (const module of modules) {
    const lesson = await Lesson.findOne({
      pathId,
      moduleId: module._id,
      isPublished: true,
    })
      .select('_id title slug')
      .sort({ order: 1 })
      .lean();

    if (lesson) {
      return lesson;
    }
  }

  return null;
}

async function getUserPathOverview(userId) {
  const userPaths = await UserPath.find({ userId }).lean();
  const pathIds = userPaths.map((item) => item.pathId);

  const paths = await LearningPath.find({
    _id: { $in: pathIds },
    isPublished: true,
  })
    .select(
      'title slug description category difficulty estimatedHours lessonCount quizCount projectCount resourceCount tags icon order certificateEnabled portfolioReady'
    )
    .lean();

  const pathMap = new Map(paths.map((path) => [path._id.toString(), path]));
  const currentLessonIds = userPaths
    .map((item) => item.currentLessonId)
    .filter(Boolean);

  const currentLessons = await Lesson.find({
    _id: { $in: currentLessonIds },
    isPublished: true,
  })
    .select('_id title slug')
    .lean();

  const lessonMap = new Map(currentLessons.map((lesson) => [lesson._id.toString(), lesson]));

  const items = userPaths
    .map((userPath) => {
      const path = pathMap.get(userPath.pathId.toString());
      if (!path) {
        return null;
      }

      const currentLesson = userPath.currentLessonId
        ? lessonMap.get(userPath.currentLessonId.toString())
        : null;

      return toUserPathDto(userPath, path, currentLesson);
    })
    .filter(Boolean);

  return {
    items,
    total: items.length,
  };
}

async function getPathEnrollmentBySlug(userId, slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    const error = new Error('Path slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const path = await LearningPath.findOne({ slug: normalizedSlug, isPublished: true })
    .select(
      'title slug description category difficulty estimatedHours lessonCount quizCount projectCount resourceCount tags icon order certificateEnabled portfolioReady'
    )
    .lean();

  if (!path) {
    return null;
  }

  const userPath = await UserPath.findOne({ userId, pathId: path._id }).lean();
  const currentLesson = userPath?.currentLessonId
    ? await Lesson.findOne({
        _id: userPath.currentLessonId,
        isPublished: true,
      })
        .select('_id title slug')
        .lean()
    : null;

  return {
    path: toPathSummary(path),
    enrollment: userPath ? toUserPathDto(userPath, path, currentLesson) : null,
  };
}

async function enrollUserInPath(userId, slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    const error = new Error('Path slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const path = await LearningPath.findOne({ slug: normalizedSlug, isPublished: true })
    .select('title slug description category difficulty estimatedHours lessonCount quizCount projectCount resourceCount tags icon order certificateEnabled portfolioReady')
    .lean();

  if (!path) {
    const error = new Error('Learning path not found.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await UserPath.findOne({ userId, pathId: path._id }).lean();
  if (existing) {
    const currentLesson = existing.currentLessonId
      ? await Lesson.findOne({ _id: existing.currentLessonId, isPublished: true })
          .select('_id title slug')
          .lean()
      : null;

    return toUserPathDto(existing, path, currentLesson);
  }

  const firstLesson = await getFirstPublishedLesson(path._id);
  const now = new Date();

  const userPath = await UserPath.create({
    userId,
    pathId: path._id,
    status: 'not-started',
    progressPercent: 0,
    currentLessonId: firstLesson?._id || null,
    enrolledAt: now,
    lastAccessedAt: now,
  });

  return toUserPathDto(userPath, path, firstLesson);
}

async function calculatePathProgress(userId, pathId) {
  const completedLessons = await UserProgress.countDocuments({
    userId,
    pathId,
    type: 'lesson',
    completed: true,
  });

  const totalLessons = await Lesson.countDocuments({
    pathId,
    isPublished: true,
  });

  if (totalLessons === 0) {
    return { completedLessons: 0, totalLessons: 0, progressPercent: 0 };
  }

  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  await UserPath.updateOne(
    { userId, pathId },
    { progressPercent, status: completedLessons === totalLessons ? 'completed' : 'in-progress' }
  );

  return { completedLessons, totalLessons, progressPercent };
}

async function markLessonComplete(userId, lessonSlug) {
  const normalizedSlug = normalizeSlug(lessonSlug);

  if (!normalizedSlug) {
    const error = new Error('Lesson slug is required.');
    error.statusCode = 400;
    throw error;
  }

  const lesson = await Lesson.findOne({ slug: normalizedSlug, isPublished: true })
    .select('_id pathId moduleId title slug')
    .lean();

  if (!lesson) {
    const error = new Error('Lesson not found.');
    error.statusCode = 404;
    throw error;
  }

  const userPath = await UserPath.findOne({ userId, pathId: lesson.pathId }).lean();

  if (!userPath) {
    const error = new Error('You must enroll in this learning path before completing lessons.');
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  await UserProgress.findOneAndUpdate(
    { userId, lessonId: lesson._id, type: 'lesson' },
    {
      $set: {
        userId,
        pathId: lesson.pathId,
        moduleId: lesson.moduleId,
        lessonId: lesson._id,
        type: 'lesson',
        completed: true,
        completedAt: now,
      },
    },
    { upsert: true, new: true }
  );

  const progressData = await calculatePathProgress(userId, lesson.pathId);

  return {
    completed: true,
    completedLessons: progressData.completedLessons,
    totalLessons: progressData.totalLessons,
    progressPercent: progressData.progressPercent,
  };
}

module.exports = {
  getUserPathOverview,
  getPathEnrollmentBySlug,
  enrollUserInPath,
  markLessonComplete,
  calculatePathProgress,
};
