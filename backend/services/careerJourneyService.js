const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');

const STAGES = ['learn', 'practice', 'prove'];
const STAGE_MASTERY = { learn: 25, practice: 60 };

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
  const data = await getJourney(userId);
  if (!data) throw Object.assign(new Error('Create a career plan first.'), { statusCode: 404 });

  const index = STAGES.indexOf(stage);
  const journeySkill = data.journey.skills.find((item) => item.skillKey === skillKey);
  const planSkill = data.plan.skills.find((item) => item.skillKey === skillKey);
  if (!journeySkill || !planSkill) throw Object.assign(new Error('Skill not found in career plan.'), { statusCode: 404 });
  if (index > 0 && journeySkill[STAGES[index - 1]].status !== 'complete') {
    throw Object.assign(new Error(`Complete ${STAGES[index - 1]} before ${stage}.`), { statusCode: 409 });
  }

  const currentLevel = index === STAGES.length - 1
    ? planSkill.targetLevel
    : Math.max(planSkill.currentLevel || 0, STAGE_MASTERY[stage]);

  const sets = {
    [`skills.$.${stage}`]: { status: 'complete', completedAt: new Date() },
    updatedAt: new Date(),
  };
  if (index < STAGES.length - 1) sets[`skills.$.${STAGES[index + 1]}.status`] = 'available';

  const [journey] = await Promise.all([
    CareerSkillJourney.findOneAndUpdate(
      { userId, 'skills.skillKey': skillKey },
      { $set: sets },
      { new: true }
    ).lean(),
    CareerPlan.updateOne(
      { userId, 'skills.skillKey': skillKey },
      { $set: { 'skills.$.currentLevel': currentLevel, 'skills.$.status': index === STAGES.length - 1 ? 'complete' : 'in-progress', generatedAt: new Date() } }
    ),
  ]);

  return { journey, updatedSkill: { skillKey, currentLevel, status: index === STAGES.length - 1 ? 'complete' : 'in-progress' } };
}

module.exports = { getJourney, updateStage };
