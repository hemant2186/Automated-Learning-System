const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('./constants/contentEnums');

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, required: true },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const codingExerciseSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    language: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
    prompt: { type: String, required: true, trim: true, maxlength: 3000 },
    starterCode: { type: String, default: '' },
    testCases: {
      type: [testCaseSchema],
      required: true,
      validate: { validator: (testCases) => Array.isArray(testCases) && testCases.length >= 1 },
    },
    topic: { type: String, trim: true, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

codingExerciseSchema.index({ lessonId: 1 }, { unique: true });

module.exports = mongoose.model('CodingExercise', codingExerciseSchema);