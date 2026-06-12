const mongoose = require('mongoose');
const { USER_PATH_STATUSES } = require('./constants/contentEnums');

const userPathSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: USER_PATH_STATUSES, default: 'not-started' },
    currentModuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    currentLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    enrolledAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    certificateIssuedAt: { type: Date, default: null },
    certificateId: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

userPathSchema.index({ userId: 1, pathId: 1 }, { unique: true });
userPathSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('UserPath', userPathSchema);
