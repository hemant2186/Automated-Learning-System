const mongoose = require('mongoose');
const { DIFFICULTY_LEVELS, PROJECT_STATUSES } = require('./constants/contentEnums');

const projectSchema = new mongoose.Schema(
  {
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    difficulty: { type: String, enum: DIFFICULTY_LEVELS, default: 'beginner' },
    requirements: [{ type: String, trim: true }],
    starterCode: { type: String, default: '' },
    hints: [{ type: String, trim: true }],
    estimatedHours: { type: Number, min: 1, max: 120, default: 4 },
    order: { type: Number, min: 1, default: 1 },
    // Legacy topic bridge for activity tracking and recommendations.
    topic: { type: String, trim: true, default: '' },
    portfolioReady: { type: Boolean, default: false },
    status: { type: String, enum: PROJECT_STATUSES, default: 'published' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectSchema.index({ pathId: 1, slug: 1 }, { unique: true });
projectSchema.index({ pathId: 1, order: 1 });
projectSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Project', projectSchema);
