const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  status: { type: String, enum: ['locked', 'available', 'in-progress', 'complete'], default: 'locked' },
  completedAt: { type: Date, default: null },
}, { _id: false });

const skillSchema = new mongoose.Schema({
  skillKey: { type: String, required: true, lowercase: true, trim: true },
  learn: { type: stageSchema, default: () => ({}) },
  practice: { type: stageSchema, default: () => ({}) },
  prove: { type: stageSchema, default: () => ({}) },
}, { _id: false });

const journeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  careerPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerPlan', required: true },
  skills: { type: [skillSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CareerSkillJourney', journeySchema);
