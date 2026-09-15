const CareerPlan = require('../models/CareerPlan');
const CareerSkillJourney = require('../models/CareerSkillJourney');
const CareerProof = require('../models/CareerProof');
const Project = require('../models/Project');

async function createProof(req, res) {
  try {
    const { skillKey, projectId, title, summary, repositoryUrl, demoUrl } = req.body || {};
    if (!skillKey || !title || !summary) return res.status(400).json({ error: 'skillKey, title and summary are required.' });

    const plan = await CareerPlan.findOne({ userId: req.user._id }).lean();
    if (!plan) return res.status(404).json({ error: 'Create a career plan first.' });
    const skill = plan.skills.find((item) => item.skillKey === String(skillKey).toLowerCase());
    if (!skill) return res.status(404).json({ error: 'Skill not found in career plan.' });

    const journey = await CareerSkillJourney.findOne({ userId: req.user._id }).lean();
    const journeySkill = journey?.skills?.find((item) => item.skillKey === skill.skillKey);
    if (journeySkill?.practice?.status !== 'complete') {
      return res.status(409).json({ error: 'Complete the Practice stage before submitting proof.' });
    }

    if (projectId) {
      const project = await Project.findOne({ _id: projectId, isPublished: true }).select('_id').lean();
      if (!project) return res.status(404).json({ error: 'Project not found.' });
    }

    const proof = await CareerProof.create({
      userId: req.user._id,
      careerId: plan.careerId,
      skillKey: skill.skillKey,
      projectId: projectId || null,
      title,
      summary,
      repositoryUrl: repositoryUrl || '',
      demoUrl: demoUrl || '',
    });

    await CareerSkillJourney.updateOne(
      { userId: req.user._id, 'skills.skillKey': skill.skillKey },
      { $set: { 'skills.$.prove.status': 'complete', 'skills.$.prove.completedAt': new Date(), updatedAt: new Date() } }
    );
    await CareerPlan.updateOne(
      { userId: req.user._id, 'skills.skillKey': skill.skillKey },
      { $set: { 'skills.$.currentLevel': skill.targetLevel, 'skills.$.status': 'complete', generatedAt: new Date() } }
    );

    return res.status(201).json({
      proof: {
        id: proof._id,
        skillKey: proof.skillKey,
        title: proof.title,
        status: proof.status,
      },
      skill: { skillKey: skill.skillKey, currentLevel: skill.targetLevel, status: 'complete' },
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Could not submit career proof.' });
  }
}

module.exports = { createProof };
