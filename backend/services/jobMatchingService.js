const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');
const CareerProof = require('../models/CareerProof');
const JobMatch = require('../models/JobMatch');

const clean = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
const has = (text, phrase) => {
  const p = clean(phrase);
  return p.length > 1 && ` ${text} `.includes(` ${p} `);
};
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const weight = (v) => v === 'core' ? 1 : v === 'supporting' ? 0.7 : 0.4;

async function analyzeJob(userId, input) {
  const plan = await CareerPlan.findOne({ userId }).populate('careerId', 'title slug targetRoles skills').lean();
  if (!plan?.careerId) throw new Error('Complete career onboarding before analyzing a job.');
  const description = String(input.description || '').trim();
  if (description.length < 80) throw new Error('Paste a fuller job description so the skill gap analysis is reliable.');

  const [journey, proofs] = await Promise.all([
    CareerSkillJourney.findOne({ userId }).lean(),
    CareerProof.find({ userId, careerId: plan.careerId._id, status: { $in: ['submitted', 'approved'] } }).select('skillKey').lean(),
  ]);
  const text = clean(`${input.title || ''} ${description}`);
  const journeyMap = new Map((journey?.skills || []).map((item) => [item.skillKey, item]));
  const proved = new Set(proofs.map((p) => p.skillKey));
  const extractedSkills = [], assessments = [], missingSkills = [], matchedSkills = [], evidenceGaps = [];

  plan.careerId.skills.forEach((skill) => {
    const signals = [skill.key, skill.title, ...(skill.topicKeywords || [])].filter(Boolean);
    const matchedBy = signals.filter((s) => has(text, s));
    if (!matchedBy.length) return;
    const planned = plan.skills.find((s) => s.skillKey === skill.key) || {};
    const journeySkill = journeyMap.get(skill.key) || {};
    const currentLevel = planned.currentLevel || 0;
    const targetLevel = planned.targetLevel || skill.masteryTarget || 100;
    const masteryPercent = targetLevel ? clamp(currentLevel / targetLevel * 100) : 0;
    const practiceComplete = journeySkill.practice?.status === 'complete';
    const proven = proved.has(skill.key);
    const status = proven && masteryPercent >= 80 ? 'ready' : masteryPercent < 70 ? 'skill-gap' : 'evidence-gap';
    const importance = skill.importance || 'core';
    extractedSkills.push({ skillKey: skill.key, title: skill.title, importance, matchedBy });
    matchedSkills.push(skill.key);
    if (status === 'skill-gap') missingSkills.push(skill.key);
    if (status !== 'ready') evidenceGaps.push(skill.key);
    assessments.push({ skillKey: skill.key, title: skill.title, currentLevel, targetLevel, masteryPercent, practiceComplete, proven, status });
  });

  const totalWeight = extractedSkills.reduce((sum, s) => sum + weight(s.importance), 0) || 1;
  const coveredWeight = assessments.reduce((sum, item) => sum + (item.masteryPercent >= 70 ? weight(extractedSkills.find((s) => s.skillKey === item.skillKey)?.importance) : 0), 0);
  const matchScore = clamp(coveredWeight / totalWeight * 100);
  const readinessNumerator = assessments.reduce((sum, item) => sum + (item.masteryPercent * 0.7 + (item.practiceComplete ? 15 : 0) + (item.proven ? 15 : 0)) * weight(extractedSkills.find((s) => s.skillKey === item.skillKey)?.importance), 0);
  const readinessDenominator = assessments.reduce((sum, item) => sum + 100 * weight(extractedSkills.find((s) => s.skillKey === item.skillKey)?.importance), 0) || 1;
  const readinessScore = clamp(readinessNumerator / readinessDenominator * 100);

  const nextActions = [];
  assessments.filter((i) => i.status === 'skill-gap').sort((a, b) => a.masteryPercent - b.masteryPercent).slice(0, 3).forEach((i) => nextActions.push(`Build ${i.title} through Learn + qualifying practice.`));
  assessments.filter((i) => i.status === 'evidence-gap' && !i.proven).slice(0, 3).forEach((i) => nextActions.push(`Add project proof for ${i.title}.`));
  if (!nextActions.length && extractedSkills.length) nextActions.push('Your mapped skills are covered. Tailor your resume and portfolio to this role.');
  if (!extractedSkills.length) nextActions.push('No Career Graph skills were confidently detected. Add a clearer job description.');

  const saved = await JobMatch.create({
    userId,
    careerId: plan.careerId._id,
    title: input.title || '',
    company: input.company || '',
    jobUrl: input.jobUrl || '',
    targetRole: plan.targetRole || plan.careerId.targetRoles?.[0] || '',
    description,
    extractedSkills, matchedSkills, missingSkills, evidenceGaps,
    skillAssessment: assessments,
    matchScore, readinessScore,
    nextActions: nextActions.slice(0, 5),
  });
  return saved.toObject();
}

const listJobs = (userId) => JobMatch.find({ userId }).sort({ createdAt: -1 }).select('-description').lean();
const getJob = (userId, id) => JobMatch.findOne({ _id: id, userId }).lean();

module.exports = { analyzeJob, listJobs, getJob };
