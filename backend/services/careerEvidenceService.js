const CareerPlan = require('../models/CareerPlan');

const normalize = (value) => String(value || '').trim().toLowerCase();

async function recordPracticeEvidence({ userId, topic, score }) {
  const plan = await CareerPlan.findOne({ userId }).populate('careerId').lean();
  if (!plan?.careerId) return null;

  const text = normalize(topic);
  const skill = (plan.careerId.skills || []).find((item) => {
    const values = [item.key, item.title, ...(item.topicKeywords || [])].map(normalize);
    return values.some((value) => value && (text === value || text.includes(value) || value.includes(text)));
  });
  if (!skill) return null;

  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  if (normalizedScore < 60) return { matchedSkill: skill.key, score: normalizedScore, practiceCompleted: false };

  const planSkill = plan.skills.find((item) => item.skillKey === skill.key);
  await CareerPlan.updateOne(
    { userId, 'skills.skillKey': skill.key },
    { $set: { 'skills.$.currentLevel': Math.min(Math.max(planSkill?.currentLevel || 0, 60), skill.masteryTarget), 'skills.$.status': 'in-progress', generatedAt: new Date() } }
  );

  return { matchedSkill: skill.key, score: normalizedScore, practiceCompleted: false };
}

module.exports = { recordPracticeEvidence };
