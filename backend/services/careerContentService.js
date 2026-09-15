const LearningPath = require('../models/LearningPath');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Project = require('../models/Project');

function skillRegex(key) {
  return new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

async function getSkillContent(skillKey) {
  const regex = skillRegex(skillKey.replace(/-/g, ' '));
  const [lessons, resources, projects] = await Promise.all([
    Lesson.find({ isPublished: true, topic: regex })
      .select('pathId title slug topic durationMinutes hasQuiz hasCodeExercise')
      .sort({ pathId: 1, order: 1 })
      .limit(12)
      .lean(),
    Resource.find({ isPublished: true, $or: [{ tags: regex }, { title: regex }, { description: regex }] })
      .select('title slug description url type difficulty tags pathId lessonId')
      .sort({ difficulty: 1, title: 1 })
      .limit(8)
      .lean(),
    Project.find({ isPublished: true, $or: [{ topic: regex }, { title: regex }, { description: regex }, { requirements: regex }] })
      .select('pathId title slug description difficulty estimatedHours topic portfolioReady')
      .sort({ difficulty: 1, order: 1 })
      .limit(6)
      .lean(),
  ]);

  const pathIds = [...new Set([
    ...lessons.map((item) => String(item.pathId)),
    ...resources.filter((item) => item.pathId).map((item) => String(item.pathId)),
    ...projects.map((item) => String(item.pathId)),
  ])];
  const paths = pathIds.length
    ? await LearningPath.find({ _id: { $in: pathIds }, isPublished: true }).select('title slug description difficulty estimatedHours').lean()
    : [];

  return { lessons, resources, projects, paths };
}

module.exports = { getSkillContent };
