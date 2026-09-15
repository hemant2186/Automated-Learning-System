const mongoose = require('mongoose');

const careerResourceSchema = new mongoose.Schema(
  {
    careerSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
    skillKey: { type: String, required: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    provider: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['course', 'playlist', 'video', 'practice', 'sheet', 'docs', 'project'], required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    isFree: { type: Boolean, default: true },
    estimatedHours: { type: Number, min: 0, max: 500, default: 0 },
    reason: { type: String, trim: true, maxlength: 600, default: '' },
    rank: { type: Number, min: 1, max: 20, default: 1 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

careerResourceSchema.index({ careerSlug: 1, skillKey: 1, rank: 1 });
careerResourceSchema.index({ careerSlug: 1, isPublished: 1 });

module.exports = mongoose.model('CareerResource', careerResourceSchema);
