const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  quizScore: { type: Number },
  codingScore: { type: Number },
  timeSpent: { type: Number }, // in minutes
  attempts: { type: Number, default: 1 },
  completed: { type: Boolean, default: false },
  feedback: { type: String },
  pointsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);