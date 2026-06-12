const mongoose = require('mongoose');
const { DIFFICULTY_LEVELS, RESOURCE_TYPES, PATH_CATEGORIES } = require('./constants/contentEnums');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    url: { type: String, trim: true, default: '' },
    type: { type: String, enum: RESOURCE_TYPES, required: true },
    category: { type: String, enum: PATH_CATEGORIES, required: true },
    // Named programmingLanguage to avoid MongoDB text-index language_override conflicts.
    programmingLanguage: { type: String, trim: true, default: 'python' },
    difficulty: { type: String, enum: DIFFICULTY_LEVELS, default: 'beginner' },
    tags: [{ type: String, trim: true }],
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', default: null, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null, index: true },
    isPublished: { type: Boolean, default: true },
    isExternal: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resourceSchema.index({ type: 1, category: 1, difficulty: 1 });
resourceSchema.index({ programmingLanguage: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
