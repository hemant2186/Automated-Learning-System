const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    headline: { type: String, trim: true, maxlength: 160, default: '' },
    summary: { type: String, trim: true, maxlength: 1200, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    linkedinUrl: { type: String, trim: true, maxlength: 300, default: '' },
    githubUrl: { type: String, trim: true, maxlength: 300, default: '' },
    websiteUrl: { type: String, trim: true, maxlength: 300, default: '' },
    experience: [{
      company: { type: String, trim: true, maxlength: 160, default: '' },
      role: { type: String, trim: true, maxlength: 160, default: '' },
      startDate: { type: String, trim: true, maxlength: 30, default: '' },
      endDate: { type: String, trim: true, maxlength: 30, default: '' },
      description: { type: String, trim: true, maxlength: 1200, default: '' },
    }],
    education: [{
      institution: { type: String, trim: true, maxlength: 180, default: '' },
      degree: { type: String, trim: true, maxlength: 180, default: '' },
      year: { type: String, trim: true, maxlength: 20, default: '' },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerProfile', careerProfileSchema);
