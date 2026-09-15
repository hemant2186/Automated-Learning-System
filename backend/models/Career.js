const mongoose = require('mongoose');

const careerResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    url: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: ['course', 'video', 'playlist', 'documentation', 'practice', 'sheet', 'project'], default: 'course' },
    free: { type: Boolean, default: true },
    preferred: { type: Boolean, default: false },
    estimatedHours: { type: Number, min: 0, max: 500, default: 0 },
    whyRecommended: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { _id: false }
);

const careerSkillSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    order: { type: Number, min: 1, required: true },
    importance: { type: String, enum: ['core', 'supporting', 'bonus'], default: 'core' },
    prerequisites: [{ type: String, trim: true, lowercase: true }],
    masteryTarget: { type: Number, min: 0, max: 100, default: 75 },
    resources: { type: [careerResourceSchema], default: [] }
  },
  { _id: false }
);

const careerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 2500 },
    category: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedWeeks: { type: Number, min: 1, max: 104, default: 16 },
    targetRoles: [{ type: String, trim: true }],
    skills: { type: [careerSkillSchema], default: [] },
    linkedLearningPaths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' }],
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

careerSchema.index({ isPublished: 1, category: 1 });
careerSchema.index({ title: 'text', description: 'text', targetRoles: 'text', 'skills.title': 'text' });

module.exports = mongoose.model('Career', careerSchema);
