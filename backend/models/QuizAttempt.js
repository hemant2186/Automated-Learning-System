const mongoose = require('mongoose');
const { QUESTION_OPTION_KEYS } = require('./constants/contentEnums');

const quizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedKey: { type: String, enum: QUESTION_OPTION_KEYS, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    answers: { type: [quizAnswerSchema], default: [] },
    score: { type: Number, min: 0, max: 100, required: true },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, min: 1, default: 1 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, quizId: 1, createdAt: -1 });
quizAttemptSchema.index({ userId: 1, lessonId: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
