const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    passed: { type: Boolean, required: true },
    hidden: { type: Boolean, default: false },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    error: { type: String, default: '' },
  },
  { _id: false }
);

const codeSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingExercise', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    testResults: { type: [testResultSchema], default: [] },
    score: { type: Number, min: 0, max: 100, required: true },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, min: 1, default: 1 },
  },
  { timestamps: true }
);

codeSubmissionSchema.index({ userId: 1, exerciseId: 1, createdAt: -1 });

module.exports = mongoose.model('CodeSubmission', codeSubmissionSchema);