const User = require('../models/User');
const pathService = require('../services/pathService');

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];

async function getOnboarding(req, res) {
  return res.json({
    onboardingCompleted: Boolean(req.user.onboardingCompleted),
    skillLevel: req.user.skillLevel,
    goals: req.user.goals || [],
  });
}

async function completeOnboarding(req, res) {
  try {
    const { skillLevel, goals } = req.body || {};
    if (!SKILL_LEVELS.includes(skillLevel)) {
      return res.status(400).json({ error: 'Skill level must be beginner, intermediate, or advanced.' });
    }
    if (!Array.isArray(goals)) return res.status(400).json({ error: 'Goals must be an array.' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { skillLevel, goals: goals.filter((goal) => typeof goal === 'string' && goal.trim()).map((goal) => goal.trim()), onboardingCompleted: true },
      { new: true }
    );
    const paths = await pathService.listPublishedPaths();
    const suggestedPath = paths.items.find((path) => path.difficulty === skillLevel) || paths.items[0] || null;
    return res.json({
      onboardingCompleted: true,
      skillLevel: user.skillLevel,
      goals: user.goals || [],
      suggestedPath,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ error: 'Could not complete onboarding.' });
  }
}

module.exports = { getOnboarding, completeOnboarding };