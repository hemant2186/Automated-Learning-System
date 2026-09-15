const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');

const STAGES = ['learn', 'practice', 'prove'];

function seedSkills(plan) {
  return (plan.skills || []).map((skill) => ({
    skillKey: skill.skillKey,
    learn: { status: skill.status === 'locked' ? 'locked' : 'available' },
    practice: { status: 'locked' },
    prove: { status: 'locked' },
  }));
}

async function getJourney(userId) {
  const plan = await CareerPlan.findOne({ userId }).lean();
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
  const skill = data.journey.skills.find((item) => item.skillKey === skillKey);
  if (!skill) throw Object.assign(new Error('Skill not found in career plan.'), { statusCode: 404 });
  if (index > 0 && skill[STAGES[index - 1]].status !== 'complete') {
    throw Object.assign(new Error(`Complete ${STAGES[index - 1]} before ${stage}.`), { statusCode: 409 });
  }

  const sets = {
    [`skills.$.${stage}`]: { status: 'complete', completedAt: new Date() },
    updatedAt: new Date(),
  };
  if (index < STAGES.length - 1) sets[`skills.$.${STAGES[index + 1]}.status`] = 'available';

  return CareerSkillJourney.findOneAndUpdate(
    { userId, 'skills.skillKey': skillKey },
    { $set: sets },
    { new: true }
  ).lean();
}

module.exports = { getJourney, updateStage };
