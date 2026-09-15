const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');

const normalize = (value) => String(value || '').trim().toLowerCase();

function journeySkills(plan) {
  return (plan.skills || []).map((skill) => ({
    skillKey: skill.skillKey,
    learn: { status: skill.status === 'locked' ? 'locked' : 'available' },
    practice: { status: 'locked' },
    prove: { status: 'locked' },
  }));
}

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
  const currentLevel = Math.min(Math.max(planSkill?.currentLevel || 0, 60), skill.masteryTarget || 75);
  await CareerPlan.updateOne(
    { userId, 'skills.skillKey': skill.key },
    { $set: { 'skills.$.currentLevel': currentLevel, 'skills.$.status': 'in-progress', generatedAt: new Date() } }
  );

  let journey = await CareerSkillJourney.findOne({ userId }).lean();
  if (!journey) {
    journey = await CareerSkillJourney.create({ userId, careerPlanId: plan._id, skills: journeySkills(plan) });
    journey = journey.toObject();
  }

  const journeySkill = journey.skills.find((item) => item.skillKey === skill.key);
  let practiceCompleted = false;
  if (journeySkill?.learn?.status === 'complete') {
    await CareerSkillJourney.updateOne(
      { userId, 'skills.skillKey': skill.key },
      { $set: { 'skills.$.practice.status': 'complete', 'skills.$.practice.completedAt': new Date(), 'skills.$.prove.status': 'available', updatedAt: new Date() } }
    );
    practiceCompleted = true;
  }

  return { matchedSkill: skill.key, score: normalizedScore, practiceCompleted, currentLevel };
}

module.exports = { recordPracticeEvidence };
