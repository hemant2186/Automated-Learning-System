const Career = require('../models/Career');
const CareerPlan = require('../models/CareerPlan');

const STARTING_LEVELS = { beginner: 0, intermediate: 40, advanced: 65 };

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return [...new Set(skills.filter((skill) => typeof skill === 'string').map((skill) => skill.trim().toLowerCase()).filter(Boolean))];
}

function buildSkillPlan(career, experienceLevel, currentSkills) {
  const known = new Set(normalizeSkills(currentSkills));
  const starting = STARTING_LEVELS[experienceLevel] || 0;

  return career.skills.slice().sort((a, b) => a.order - b.order).map((skill) => {
    const knownSkill = known.has(skill.key);
    const currentLevel = knownSkill ? Math.max(starting, skill.masteryTarget) : starting;
    const ready = (skill.prerequisites || []).every((key) => known.has(key));
    let status = 'locked';
    if (currentLevel >= skill.masteryTarget) status = 'complete';
    else if (ready) status = knownSkill ? 'in-progress' : 'next';
    return { skillKey: skill.key, currentLevel, targetLevel: skill.masteryTarget, status, priority: skill.importance === 'core' ? 1 : 2 };
  });
}

async function getPlanForUser(userId) {
  return CareerPlan.findOne({ userId }).populate('careerId').lean();
}

async function createOrUpdatePlan(userId, input) {
  const career = await Career.findOne({ slug: input.careerSlug, isPublished: true });
  if (!career) throw Object.assign(new Error('Career not found.'), { statusCode: 404 });

  const level = ['beginner', 'intermediate', 'advanced'].includes(input.experienceLevel) ? input.experienceLevel : 'beginner';
  const currentSkills = normalizeSkills(input.currentSkills);
  const hoursPerWeek = Math.min(80, Math.max(1, Number(input.hoursPerWeek) || 7));
  const targetWeeks = Math.min(104, Math.max(1, Number(input.targetWeeks) || career.estimatedWeeks || 16));
  const skills = buildSkillPlan(career, level, currentSkills);

  const existing = await CareerPlan.findOne({ userId });
  const values = { careerId: career._id, experienceLevel: level, hoursPerWeek, targetWeeks, currentSkills, targetRole: typeof input.targetRole === 'string' ? input.targetRole.trim() : '', skills, generatedAt: new Date() };
  const plan = existing ? await CareerPlan.findOneAndUpdate({ userId }, values, { new: true }) : await CareerPlan.create({ userId, ...values });
  return plan.populate('careerId');
}

module.exports = { getPlanForUser, createOrUpdatePlan };
