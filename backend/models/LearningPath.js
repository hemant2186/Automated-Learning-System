const mongoose = require('mongoose');
const { PATH_CATEGORIES, DIFFICULTY_LEVELS } = require('./constants/contentEnums');

const learningPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    icon: { type: String, trim: true, default: 'code' },
    category: { type: String, enum: PATH_CATEGORIES, required: true },
    difficulty: { type: String, enum: DIFFICULTY_LEVELS, default: 'beginner' },
    estimatedHours: { type: Number, min: 1, max: 500, default: 10 },
    lessonCount: { type: Number, min: 0, default: 0 },
    quizCount: { type: Number, min: 0, default: 0 },
    projectCount: { type: Number, min: 0, default: 0 },
    resourceCount: { type: Number, min: 0, default: 0 },
    tags: [{ type: String, trim: true }],
    // Maps to legacy Activity.topic values for recommendation-engine bridging.
    topics: [{ type: String, trim: true }],
    isPublished: { type: Boolean, default: true },
    order: { type: Number, min: 0, default: 0 },
    certificateEnabled: { type: Boolean, default: false },
    portfolioReady: { type: Boolean, default: false },
  },
  { timestamps: true }
);

learningPathSchema.index({ category: 1, order: 1 });
learningPathSchema.index({ isPublished: 1, category: 1 });
// slug uniqueness is enforced by the field-level `unique: true` on slug.

module.exports = mongoose.model('LearningPath', learningPathSchema);
