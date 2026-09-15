const CareerPlan = require('../models/CareerPlan');
const CareerProfile = require('../models/CareerProfile');
const CareerProof = require('../models/CareerProof');
const User = require('../models/User');

async function getPortfolio(userId) {
  const [user, plan, profile, proofs] = await Promise.all([
    User.findById(userId).select('name email').lean(),
    CareerPlan.findOne({ userId }).populate('careerId', 'title slug targetRoles skills').lean(),
    CareerProfile.findOne({ userId }).lean(),
    CareerProof.find({ userId, status: { $in: ['submitted', 'approved'] } })
      .select('careerId skillKey title summary repositoryUrl demoUrl status submittedAt createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  if (!user || !plan?.careerId) return null;

  const provenSkillKeys = new Set(proofs.map((proof) => proof.skillKey));
  const verifiedSkills = plan.skills.map((item) => {
    const definition = plan.careerId.skills?.find((skill) => skill.key === item.skillKey) || {};
    return {
      skillKey: item.skillKey,
      title: definition.title || item.skillKey,
      currentLevel: item.currentLevel,
      targetLevel: item.targetLevel,
      status: item.status,
      verified: provenSkillKeys.has(item.skillKey) && item.status === 'complete',
      importance: definition.importance || 'core',
    };
  });

  return {
    profile: profile || { headline: '', summary: '', location: '', phone: '', linkedinUrl: '', githubUrl: '', websiteUrl: '', experience: [], education: [] },
    user: { name: user.name, email: user.email },
    career: {
      title: plan.careerId.title,
      targetRole: plan.targetRole || plan.careerId.targetRoles?.[0] || '',
      slug: plan.careerId.slug,
    },
    verifiedSkills,
    proofs: proofs.map((proof) => ({
      id: proof._id,
      skillKey: proof.skillKey,
      title: proof.title,
      summary: proof.summary,
      repositoryUrl: proof.repositoryUrl,
      demoUrl: proof.demoUrl,
      status: proof.status,
      submittedAt: proof.submittedAt,
    })),
  };
}

async function saveProfile(userId, input) {
  const allowed = ['headline', 'summary', 'location', 'phone', 'linkedinUrl', 'githubUrl', 'websiteUrl', 'experience', 'education'];
  const values = {};
  allowed.forEach((key) => { if (input[key] !== undefined) values[key] = input[key]; });
  return CareerProfile.findOneAndUpdate({ userId }, { $set: values }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
}

async function getResume(userId) {
  const portfolio = await getPortfolio(userId);
  if (!portfolio) return null;

  const skills = portfolio.verifiedSkills
    .filter((skill) => skill.verified)
    .sort((a, b) => (a.importance === 'core' ? -1 : 1) - (b.importance === 'core' ? -1 : 1))
    .map((skill) => skill.title);

  const projects = portfolio.proofs.map((proof) => ({
    title: proof.title,
    summary: proof.summary,
    skill: portfolio.verifiedSkills.find((skill) => skill.skillKey === proof.skillKey)?.title || proof.skillKey,
    repositoryUrl: proof.repositoryUrl,
    demoUrl: proof.demoUrl,
  }));

  const profile = portfolio.profile;
  const summary = profile.summary || `Career-focused ${portfolio.career.title} candidate with verified hands-on evidence in ${skills.slice(0, 5).join(', ') || 'core skills'}.`;

  return {
    contact: {
      name: portfolio.user.name,
      email: portfolio.user.email,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      websiteUrl: profile.websiteUrl,
    },
    headline: profile.headline || portfolio.career.targetRole,
    summary,
    skills,
    projects,
    experience: profile.experience || [],
    education: profile.education || [],
    targetRole: portfolio.career.targetRole,
    verifiedSkillCount: skills.length,
  };
}

module.exports = { getPortfolio, saveProfile, getResume };
