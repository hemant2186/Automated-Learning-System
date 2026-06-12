const mongoose = require('mongoose');
const { CONTENT_FORMATS } = require('./constants/contentEnums');

const exampleCodeSchema = new mongoose.Schema(
  {
    language: { type: String, trim: true, default: 'python' },
    code: { type: String, default: '' },
  },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    prompt: { type: String, trim: true, default: '' },
    starterCode: { type: String, default: '' },
    hints: [{ type: String, trim: true }],
    solutionOutline: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// Lesson ordering rule: sort by Module.order, then Lesson.order within each module.
// Do not rely on path-wide Lesson.order alone — order values may repeat across modules.
const lessonSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    order: { type: Number, required: true, min: 1 },
    contentFormat: { type: String, enum: CONTENT_FORMATS, default: 'markdown' },
    content: { type: String, default: '' },
    exampleCode: { type: exampleCodeSchema, default: () => ({}) },
    practice: { type: practiceSchema, default: () => ({}) },
    durationMinutes: { type: Number, min: 1, max: 240, default: 10 },
    // Legacy topic string used by Activity ingest and recommender.js.
    topic: { type: String, trim: true, default: '' },
    hasQuiz: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

lessonSchema.index({ pathId: 1, slug: 1 }, { unique: true });
lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ pathId: 1, order: 1 });
lessonSchema.index({ topic: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
