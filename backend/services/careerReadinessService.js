const CareerPlan = require('../models/CareerPlan');
const Career = require('../models/Career');
const CareerSkillJourney = require('../models/CareerSkillJourney');
const CareerProof = require('../models/CareerProof');

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function getReadiness(userId) {
  const plan = await CareerPlan.findOne({ userId }).populate('careerId', 'title slug targetRoles skills').lean();
  if (!plan?.careerId) return null;

  const [journey, proofs] = await Promise.all([
    CareerSkillJourney.findOne({ userId }).lean(),
    CareerProof.find({ userId, careerId: plan.careerId._id, status: { $in: ['submitted', 'approved'] } })
      .select('skillKey title status submittedAt repositoryUrl demoUrl')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const journeyBySkill = new Map((journey?.skills || []).map((item) => [item.skillKey, item]));
  const proofBySkill = new Map();
  proofs.forEach((proof) => {
    if (!proofBySkill.has(proof.skillKey)) proofBySkill.set(proof.skillKey, proof);
  });

  const skills = plan.skills.map((item) => {
    const definition = plan.careerId.skills?.find((skill) => skill.key === item.skillKey) || {};
    const skillJourney = journeyBySkill.get(item.skillKey) || {};
    const proof = proofBySkill.get(item.skillKey) || null;
    const mastery = item.targetLevel > 0 ? clamp((item.currentLevel / item.targetLevel) * 100) : 0;
    const practice = skillJourney.practice?.status === 'complete' ? 100 : 0;
    const prove = proof ? 100 : 0;
    const importance = definition.importance || 'core';
    const weight = importance === 'core' ? 1 : importance === 'supporting' ? 0.7 : 0.4;
    return {
      skillKey: item.skillKey,
      title: definition.title || item.skillKey,
      importance,
      currentLevel: item.currentLevel,
      targetLevel: item.targetLevel,
      masteryPercent: mastery,
      practicePercent: practice,
      proofPercent: prove,
      status: item.status,
      proof: proof ? { title: proof.title, status: proof.status, repositoryUrl: proof.repositoryUrl, demoUrl: proof.demoUrl } : null,
      weightedScore: mastery * 0.6 * weight + practice * 0.2 * weight + prove * 0.2 * weight,
    };
  });

  const totalWeight = skills.reduce((sum, skill) => sum + (skill.importance === 'core' ? 1 : skill.importance === 'supporting' ? 0.7 : 0.4), 0) || 1;
  const weightedReadiness = skills.reduce((sum, skill) => sum + skill.weightedScore, 0) / totalWeight;
  const coreSkills = skills.filter((skill) => skill.importance === 'core');
  const provenCore = coreSkills.filter((skill) => skill.proof).length;
  const practiceCovered = skills.filter((skill) => skill.practicePercent === 100).length;
  const portfolioScore = coreSkills.length ? clamp((provenCore / coreSkills.length) * 100) : 0;
  const practiceCoverage = skills.length ? clamp((practiceCovered / skills.length) * 100) : 0;

  const weakest = [...skills].sort((a, b) => a.masteryPercent - b.masteryPercent).slice(0, 3);
  const nextActions = weakest.filter((skill) => skill.currentLevel < skill.targetLevel || !skill.proof).map((skill) => ({
    skillKey: skill.skillKey,
    title: skill.title,
    action: !skill.practicePercent ? 'Complete Learn, then pass a qualifying quiz or coding exercise.' : !skill.proof ? 'Submit a portfolio proof for this skill.' : 'Raise mastery to the target level.',
  }));

  const score = clamp(weightedReadiness);
  const label = score >= 85 ? 'Job-ready' : score >= 70 ? 'Nearly ready' : score >= 50 ? 'Building readiness' : 'Early stage';

  return {
    career: { id: plan.careerId._id, title: plan.careerId.title, slug: plan.careerId.slug, targetRole: plan.targetRole || plan.careerId.targetRoles?.[0] || '' },
    score,
    label,
    portfolioScore,
    practiceCoverage,
    coreSkillCount: coreSkills.length,
    provenCoreSkillCount: provenCore,
    skills,
    nextActions: nextActions.slice(0, 3),
  };
}

module.exports = { getReadiness };
