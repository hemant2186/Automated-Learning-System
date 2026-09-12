const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const QuizAttempt = require('../models/QuizAttempt');
const quizService = require('../services/quizService');
const { recordActivity } = require('../services/activityService');
const UserProgress = require('../models/UserProgress');

function publicQuiz(quiz) {
  return {
    id: quiz._id.toString(), title: quiz.title, passingScore: quiz.passingScore,
    lessonId: quiz.lessonId.toString(),
    questions: quiz.questions.sort((a, b) => a.order - b.order).map((question) => ({
      id: question._id.toString(), prompt: question.prompt,
      options: question.options.map((option) => ({ key: option.key, text: option.text })),
    })),
  };
}

async function getQuiz(req, res) {
  try {
    const quiz = await Quiz.findOne({ lessonId: req.params.lessonId, isPublished: true })
      .select('_id title lessonId passingScore questions').lean();
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    return res.json(publicQuiz(quiz));
  } catch (error) {
    return res.status(500).json({ error: 'Could not load quiz.' });
  }
}

async function submitQuiz(req, res) {
  try {
    if (!Array.isArray(req.body?.answers)) {
      return res.status(201).json(await quizService.submitQuiz(req.user._id, req.params.quizId, req.body?.answers));
    }
    const quiz = await Quiz.findOne({ _id: req.params.quizId, isPublished: true }).lean();
    if (!quiz) {
      try {
        return res.status(201).json(await quizService.submitQuiz(req.user._id, req.params.quizId, req.body?.answers));
      } catch (legacyError) {
        return res.status(legacyError.statusCode || 404).json({ error: legacyError.message || 'Quiz not found.' });
      }
    }
    const lesson = await Lesson.findOne({ _id: quiz.lessonId, isPublished: true }).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const submitted = new Map(answers.map((answer) => [String(answer.questionId), answer.selectedKey]));
    let correct = 0;
    const storedAnswers = [];
    const correctAnswers = [];
    const explanations = [];
    quiz.questions.forEach((question) => {
      const questionId = question._id.toString();
      const selectedKey = submitted.get(questionId);
      const isCorrect = selectedKey === question.correctKey;
      if (isCorrect) correct += 1;
      if (selectedKey) storedAnswers.push({ questionId: question._id, selectedKey, correct: isCorrect });
      correctAnswers.push({ questionId, correctKey: question.correctKey, selectedKey: selectedKey || null, correct: isCorrect });
      explanations.push({ questionId, explanation: question.explanation || '' });
    });

    const total = quiz.questions.length;
    const score = total ? Math.round((correct / total) * 100) : 0;
    const passed = score >= quiz.passingScore;
    const attemptNumber = await QuizAttempt.countDocuments({ userId: req.user._id, quizId: quiz._id }) + 1;
    await QuizAttempt.create({ userId: req.user._id, quizId: quiz._id, lessonId: lesson._id, pathId: lesson.pathId,
      answers: storedAnswers, score, correct, total, passed, attemptNumber });
    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, lessonId: lesson._id, type: 'quiz' },
      { $set: { userId: req.user._id, pathId: lesson.pathId, moduleId: lesson.moduleId, lessonId: lesson._id, quizId: quiz._id, type: 'quiz', completed: passed, score, completedAt: passed ? new Date() : null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const timeSpent = Math.min(480, Math.max(0, Number(req.body?.timeSpentSeconds) / 60 || 0));
    await recordActivity({ userId: req.user._id, topic: lesson.topic, quizScore: score, codingScore: 0,
      timeSpent, attempts: attemptNumber, completed: passed });
    return res.status(201).json({ score, passed, correctAnswers, explanations, attemptNumber });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Could not submit quiz.' });
  }
}

async function getLegacyQuiz(req, res) {
  try {
    return res.json(await quizService.fetchQuiz(req.user._id, req.params.lessonSlug));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not load quiz.' });
  }
}

async function submitLegacyQuiz(req, res) {
  try {
    return res.status(201).json(await quizService.submitQuiz(req.user._id, req.params.lessonSlug, req.body?.answers));
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || 'Could not submit quiz.' });
  }
}

async function getLegacyQuizResults(req, res) {
  try {
    return res.json(await quizService.fetchLatestResult(req.user._id, req.params.lessonSlug));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not load quiz result.' });
  }
}

module.exports = {
  getQuiz, submitQuiz, getLegacyQuiz, submitLegacyQuiz, getLegacyQuizResults,
};
