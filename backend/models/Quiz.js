const mongoose = require('mongoose');
const { QUESTION_OPTION_KEYS } = require('./constants/contentEnums');

const questionOptionSchema = new mongoose.Schema(
  {
    key: { type: String, enum: QUESTION_OPTION_KEYS, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true, min: 1 },
    prompt: { type: String, required: true, trim: true, maxlength: 1000 },
    options: {
      type: [questionOptionSchema],
      required: true,
      validate: {
        validator(options) {
          return Array.isArray(options) && options.length >= 2 && options.length <= 4;
        },
        message: 'Each question must have between 2 and 4 options.',
      },
    },
    // API rule: correctKey must never be included in public quiz responses.
    correctKey: { type: String, enum: QUESTION_OPTION_KEYS, required: true },
    explanation: { type: String, trim: true, maxlength: 1500, default: '' },
  },
  { _id: true }
);

questionSchema.pre('validate', function validateCorrectKeyOption(next) {
  const optionKeys = (this.options || []).map((option) => option.key);
  if (!optionKeys.includes(this.correctKey)) {
    this.invalidate('correctKey', 'correctKey must match one of the provided option keys.');
  }
  next();
});

const quizSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    passingScore: { type: Number, min: 0, max: 100, default: 70 },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator(questions) {
          return Array.isArray(questions) && questions.length >= 1;
        },
        message: 'A quiz must contain at least one question.',
      },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

quizSchema.index({ pathId: 1 });
// lessonId uniqueness is enforced by the field-level `unique: true` on lessonId.

module.exports = mongoose.model('Quiz', quizSchema);
module.exports.questionSchema = questionSchema;
