const mongoose = require('mongoose');

const progressSnapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  masteryScore: { type: Number, required: true },
  status: { type: String, enum: ['strong', 'developing', 'weak'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProgressSnapshot', progressSnapshotSchema);