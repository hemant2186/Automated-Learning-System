const UserPath = require('../models/UserPath');
const UserProgress = require('../models/UserProgress');
const Activity = require('../models/Activity');
const LearningPath = require('../models/LearningPath');
const Lesson = require('../models/Lesson');

let recommender = null;
try {
  recommender = require('./recommender');
} catch (e) {
  // optional
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function getPersonalizationForUser(userId) {
  // 1) Load enrollments
  const userPaths = await UserPath.find({ userId }).select('pathId status progressPercent currentLessonId').lean();
  const pathIds = userPaths.map((p) => p.pathId).filter(Boolean);

  // 2) Load learning path metadata for enrolled paths
  const pathsById = new Map();
  if (pathIds.length) {
    const paths = await LearningPath.find({ _id: { $in: pathIds } }).select('slug title').lean();
    for (const p of paths) pathsById.set(p._id.toString(), p);
  }

  // 3) Load completed lessons for user
  const completedProgress = await UserProgress.find({ userId, type: 'lesson', completed: true })
    .select('lessonId pathId')
    .lean();
  const completedLessonIds = completedProgress.map((c) => c.lessonId).filter(Boolean).map(String);
  const completedPathIds = new Set(completedProgress.map((c) => c.pathId && c.pathId.toString()));

  // 4) Fetch lesson topics for completed lessons (batch)
  const strengths = [];
  if (completedLessonIds.length) {
    const lessons = await Lesson.find({ _id: { $in: completedLessonIds } }).select('topic title').lean();
    const topicCount = new Map();
    for (const l of lessons) {
      const topic = safeString(l.topic) || safeString(l.title) || 'General';
      topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
    }
    // sort by frequency and return top 5 simple list
    strengths.push(...[...topicCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((t) => t[0]));
  }

  // Include completed learning path titles as strengths
  const completedPathTitles = [];
  if (userPaths.length) {
    for (const up of userPaths) {
      if (Number(up.progressPercent) >= 100) {
        const p = pathsById.get((up.pathId || '').toString());
        if (p) completedPathTitles.push(safeString(p.title));
      }
    }
  }
  // prepend completed path titles to strengths
  const finalStrengths = Array.from(new Set([...completedPathTitles, ...strengths])).slice(0, 5);

  // 5) Weaknesses: enrolled lessons not completed -> collect topics of first few incomplete lessons
  const weaknesses = [];
  if (userPaths.length) {
    // batch fetch lessons per enrolled path but limit total work
    const maxPerPath = 5;
    for (const up of userPaths) {
      if (!up.pathId) continue;
      const lessons = await Lesson.find({ pathId: up.pathId, isPublished: true })
        .select('topic title _id')
        .sort({ order: 1 })
        .limit(maxPerPath)
        .lean();

      for (const l of lessons) {
        if (completedLessonIds.includes(String(l._id))) continue; // already completed
        const topic = safeString(l.topic) || safeString(l.title) || 'General';
        if (!weaknesses.includes(topic)) weaknesses.push(topic);
        if (weaknesses.length >= 5) break;
      }
      if (weaknesses.length >= 5) break;
    }
  }

  // 6) Recommended lesson: prefer currentLesson from in-progress enrollment
  let recommendedLesson = null;
  let recommendedPath = null;
  const inProgress = userPaths.find((p) => p.status === 'in-progress');
  if (inProgress) {
    const pathMeta = pathsById.get((inProgress.pathId || '').toString());
    if (inProgress.currentLessonId) {
      const lesson = await Lesson.findOne({ _id: inProgress.currentLessonId }).select('slug title').lean();
      if (lesson) recommendedLesson = { slug: lesson.slug, title: lesson.title };
    }
    if (pathMeta) recommendedPath = { slug: pathMeta.slug, title: pathMeta.title };
  }

  // 7) Fallback recommended lesson/path using recommender analysis or simple heuristics
  if (!recommendedLesson || !recommendedPath) {
    try {
      if (recommender && typeof recommender.analyzeUser === 'function') {
        const analysis = await recommender.analyzeUser(userId);
        const recs = recommender.getRecommendations ? recommender.getRecommendations(analysis) : [];
        // Map recommended topic to a path by tag/title match
        const topic = recs && recs[0] && (recs[0].topic || recs[0].topicName || recs[0].topic);
        if (topic) {
          const lp = await LearningPath.findOne({ tags: topic }).select('slug title').lean();
          if (lp && !recommendedPath) recommendedPath = { slug: lp.slug, title: lp.title };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Extra fallback: recommend first enrolled not completed path
  if (!recommendedPath && userPaths.length) {
    const candidate = userPaths.find((p) => Number(p.progressPercent) < 100) || userPaths[0];
    if (candidate) {
      const meta = pathsById.get((candidate.pathId || '').toString());
      if (meta) recommendedPath = { slug: meta.slug, title: meta.title };
    }
  }

  // 8) Study suggestion (template-driven)
  let studySuggestion = '';
  if (finalStrengths.length && weaknesses.length && recommendedPath) {
    studySuggestion = `You completed ${finalStrengths.slice(0, 2).join(' and ')}. Focus on ${weaknesses[0]} before moving to ${recommendedPath.title}.`;
  } else if (weaknesses.length && recommendedPath) {
    studySuggestion = `Focus on ${weaknesses[0]} before moving to ${recommendedPath.title}.`;
  } else if (weaknesses.length) {
    studySuggestion = `Focus on ${weaknesses[0]} to strengthen your foundation.`;
  }

  // 9) Build DTO
  const dto = {
    recommendedPath: recommendedPath || null,
    recommendedLesson: recommendedLesson || null,
    strengths: finalStrengths,
    weaknesses,
    studySuggestion: safeString(studySuggestion),
  };

  return dto;
}

module.exports = { getPersonalizationForUser };
