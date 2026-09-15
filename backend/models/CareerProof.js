const mongoose = require('mongoose');

const careerProofSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
    skillKey: { type: String, required: true, trim: true, lowercase: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    repositoryUrl: { type: String, trim: true, default: '' },
    demoUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

careerProofSchema.index({ userId: 1, careerId: 1, skillKey: 1, createdAt: -1 });

module.exports = mongoose.model('CareerProof', careerProofSchema);
