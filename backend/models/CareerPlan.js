const mongoose = require('mongoose');

const careerPlanSkillSchema = new mongoose.Schema(
  {
    skillKey: { type: String, required: true, trim: true, lowercase: true },
    currentLevel: { type: Number, min: 0, max: 100, default: 0 },
    targetLevel: { type: Number, min: 0, max: 100, default: 75 },
    status: { type: String, enum: ['locked', 'next', 'in-progress', 'ready', 'complete'], default: 'locked' },
    priority: { type: Number, min: 1, default: 1 },
  },
  { _id: false }
);

const careerPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    hoursPerWeek: { type: Number, min: 1, max: 80, default: 7 },
    targetWeeks: { type: Number, min: 1, max: 104, default: 16 },
    currentSkills: [{ type: String, trim: true, lowercase: true }],
    targetRole: { type: String, trim: true, default: '' },
    skills: { type: [careerPlanSkillSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

careerPlanSchema.index({ careerId: 1, updatedAt: -1 });

module.exports = mongoose.model('CareerPlan', careerPlanSchema);
