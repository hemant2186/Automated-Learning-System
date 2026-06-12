const mongoose = require('mongoose');

// Lesson ordering rule: list modules by Module.order, then lessons by Lesson.order within each module.
const moduleSchema = new mongoose.Schema(
  {
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    order: { type: Number, required: true, min: 1 },
    lessonCount: { type: Number, min: 0, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

moduleSchema.index({ pathId: 1, order: 1 });
moduleSchema.index({ pathId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Module', moduleSchema);
