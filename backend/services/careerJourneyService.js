const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');

const STAGES = ['learn', 'practice', 'prove'];
const STAGE_MASTERY = { learn: 25 };

function seedSkills(plan) {
  return (plan.skills || []).map((skill) => ({
    skillKey: skill.skillKey,
    learn: { status: skill.status === 'locked' ? 'locked' : 'available' },
    practice: { status: 'locked' },
    prove: { status: 'locked' },
  }));
}

async function getJourney(userId) {
  const plan = await CareerPlan.findOne({ userId }).populate('careerId', 'title slug description targetRoles').lean();
  if (!plan) return null;
  let journey = await CareerSkillJourney.findOne({ userId }).lean();
  if (!journey) {
    journey = await CareerSkillJourney.create({ userId, careerPlanId: plan._id, skills: seedSkills(plan) });
    journey = journey.toObject();
  }
  return { plan, journey };
}

async function updateStage(userId, skillKey, stage) {
  if (!STAGES.includes(stage)) throw Object.assign(new Error('Invalid journey stage.'), { statusCode: 400 });
  if (stage === 'practice') {
    throw Object.assign(new Error('Practice is completed automatically from qualifying quiz or coding evidence.'), { statusCode: 409 });
  }
  if (stage === 'prove') {
    throw Object.assign(new Error('Submit project proof to complete the Prove stage.'), { statusCode: 409 });
  }

  const data = await getJourney(userId);
  if (!data) throw Object.assign(new Error('Create a career plan first.'), { statusCode: 404 });

  const journeySkill = data.journey.skills.find((item) => item.skillKey === skillKey);
  const planSkill = data.plan.skills.find((item) => item.skillKey === skillKey);
  if (!journeySkill || !planSkill) throw Object.assign(new Error('Skill not found in career plan.'), { statusCode: 404 });

  const currentLevel = Math.max(planSkill.currentLevel || 0, STAGE_MASTERY.learn);
  const [journey] = await Promise.all([
    CareerSkillJourney.findOneAndUpdate(
      { userId, 'skills.skillKey': skillKey },
      { $set: { 'skills.$.learn': { status: 'complete', completedAt: new Date() }, 'skills.$.practice.status': 'available', updatedAt: new Date() } },
      { new: true }
    ).lean(),
    CareerPlan.updateOne(
      { userId, 'skills.skillKey': skillKey },
      { $set: { 'skills.$.currentLevel': currentLevel, 'skills.$.status': 'in-progress', generatedAt: new Date() } }
    ),
  ]);

  return { journey, updatedSkill: { skillKey, currentLevel, status: 'in-progress' } };
}

module.exports = { getJourney, updateStage };
