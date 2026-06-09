const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true, trim: true },
  quizScore: { type: Number, min: 0, max: 100, default: 0 },
  codingScore: { type: Number, min: 0, max: 100, default: 0 },
  timeSpent: { type: Number, min: 0, max: 480, default: 0 }, // in minutes
  attempts: { type: Number, min: 1, max: 25, default: 1 },
  completed: { type: Boolean, default: false },
  feedback: { type: String, trim: true, maxlength: 1000 },
  pointsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, topic: 1 });

module.exports = mongoose.model('Activity', activitySchema);
