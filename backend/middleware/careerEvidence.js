const QuizAttempt = require('../models/QuizAttempt');
const CodeSubmission = require('../models/CodeSubmission');
const CodingExercise = require('../models/CodingExercise');
const Lesson = require('../models/Lesson');
const { recordPracticeEvidence } = require('../services/careerEvidenceService');

function withCareerEvidence(type, handler) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      try {
        if (type === 'code') {
          const submission = await CodeSubmission.findOne({ userId: req.user._id, exerciseId: req.params.exerciseId })
            .sort({ createdAt: -1 }).lean();
          if (!submission) return;
          const exercise = await CodingExercise.findById(submission.exerciseId).select('topic').lean();
          await recordPracticeEvidence({ userId: req.user._id, topic: exercise?.topic, score: submission.score });
          return;
        }
        const attempt = await QuizAttempt.findOne({ userId: req.user._id, quizId: req.params.quizId })
          .sort({ createdAt: -1 }).lean();
        if (!attempt) return;
        const lesson = await Lesson.findById(attempt.lessonId).select('topic').lean();
        await recordPracticeEvidence({ userId: req.user._id, topic: lesson?.topic, score: attempt.score });
      } catch (error) {
        console.error('Career evidence update failed:', error.message);
      }
    });
    return handler(req, res, next);
  };
}

module.exports = { withCareerEvidence };
