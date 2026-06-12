const mongoose = require('mongoose');
const { PROGRESS_TYPES } = require('./constants/contentEnums');

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    type: { type: String, enum: PROGRESS_TYPES, required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number, min: 0, max: 100, default: null },
  // Legacy topic bridge when syncing with Activity-based recommendations.
    topic: { type: String, trim: true, default: '' },
    completedAt: { type: Date, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, lessonId: 1, type: 1 }, { unique: true, sparse: true });
userProgressSchema.index({ userId: 1, projectId: 1, type: 1 }, { unique: true, sparse: true });
userProgressSchema.index({ userId: 1, pathId: 1, type: 1 });
userProgressSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
