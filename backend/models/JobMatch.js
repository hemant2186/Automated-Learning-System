const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    title: { type: String, trim: true, maxlength: 200, default: '' },
    company: { type: String, trim: true, maxlength: 200, default: '' },
    jobUrl: { type: String, trim: true, maxlength: 500, default: '' },
    targetRole: { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, trim: true, maxlength: 20000, required: true },
    extractedSkills: [{ skillKey: String, title: String, importance: String, matchedBy: [String] }],
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    evidenceGaps: [{ type: String }],
    skillAssessment: [{ skillKey: String, title: String, currentLevel: Number, targetLevel: Number, masteryPercent: Number, practiceComplete: Boolean, proven: Boolean, status: String }],
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    nextActions: [{ type: String }],
  },
  { timestamps: true }
);

jobMatchSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JobMatch', jobMatchSchema);
