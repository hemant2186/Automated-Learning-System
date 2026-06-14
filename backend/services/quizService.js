const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const UserPath = require('../models/UserPath');
const UserProgress = require('../models/UserProgress');
const { QUESTION_OPTION_KEYS } = require('../models/constants/contentEnums');

const DEFAULT_PASSING_SCORE = 70;
const LESSON_FIELDS = '_id pathId moduleId title slug isPublished';
const QUIZ_FIELDS = '_id title lessonId pathId passingScore questions isPublished';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeSlug(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function questionOptionsToDto(options = []) {
  return options.reduce((acc, option) => {
    acc[option.key] = option.text;
    return acc;
  }, {});
}

function toQuizDto(lesson, quiz) {
  const questions = [...(quiz.questions || [])]
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      id: question._id.toString(),
      prompt: question.prompt,
      options: questionOptionsToDto(question.options),
    }));

  return {
    title: quiz.title,
    lessonSlug: lesson.slug,
    questions,
  };
}

function toResultDto(attempt) {
  if (!attempt) {
    return null;
  }

  return {
    score: attempt.score,
    correct: attempt.correct,
    total: attempt.total,
    passed: attempt.passed,
    completedAt: attempt.completedAt,
  };
}

async function getLessonAndQuiz(lessonSlug) {
  const normalizedSlug = normalizeSlug(lessonSlug);

  if (!normalizedSlug) {
    throw createError('Lesson slug is required.', 400);
  }

  const lesson = await Lesson.findOne({ slug: normalizedSlug, isPublished: true })
    .select(LESSON_FIELDS)
    .lean();

  if (!lesson) {
    throw createError('Lesson not found.', 404);
  }

  const quiz = await Quiz.findOne({ lessonId: lesson._id, isPublished: true })
    .select(QUIZ_FIELDS)
    .lean();

  if (!quiz) {
    throw createError('Quiz not found.', 404);
  }

  return { lesson, quiz };
}

async function validateEnrollment(userId, pathId) {
  const enrollment = await UserPath.findOne({ userId, pathId })
    .select('_id')
    .lean();

  if (!enrollment) {
    throw createError('You must enroll in this learning path before opening quizzes.', 403);
  }

  return enrollment;
}

async function fetchQuiz(userId, lessonSlug) {
  const { lesson, quiz } = await getLessonAndQuiz(lessonSlug);
  await validateEnrollment(userId, lesson.pathId);

  return toQuizDto(lesson, quiz);
}

function validateAnswersPayload(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw createError('Answers must be provided as an object keyed by question id.', 400);
  }

  Object.entries(answers).forEach(([questionId, selectedKey]) => {
    if (!questionId || typeof questionId !== 'string') {
      throw createError('Each answer must use a valid question id.', 400);
    }

    if (selectedKey == null) {
      return;
    }

    if (!QUESTION_OPTION_KEYS.includes(selectedKey)) {
      throw createError('Each answer must be one of A, B, C, or D.', 400);
    }
  });
}

function gradeQuiz(quiz, answers) {
  const questions = quiz.questions || [];
  const questionIds = new Set(questions.map((question) => question._id.toString()));

  Object.keys(answers).forEach((questionId) => {
    if (!questionIds.has(questionId)) {
      throw createError('Answers include a question that does not belong to this quiz.', 400);
    }
  });

  let correct = 0;
  const storedAnswers = [];

  questions.forEach((question) => {
    const questionId = question._id.toString();
    const selectedKey = answers[questionId];
    const isCorrect = selectedKey === question.correctKey;

    if (isCorrect) {
      correct += 1;
    }

    if (selectedKey) {
      storedAnswers.push({
        questionId: question._id,
        selectedKey,
        correct: isCorrect,
      });
    }
  });

  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passingScore = Number.isFinite(quiz.passingScore) ? quiz.passingScore : DEFAULT_PASSING_SCORE;

  return {
    score,
    correct,
    total,
    passed: score >= passingScore,
    storedAnswers,
  };
}

async function submitQuiz(userId, lessonSlug, answers) {
  validateAnswersPayload(answers);

  const { lesson, quiz } = await getLessonAndQuiz(lessonSlug);
  await validateEnrollment(userId, lesson.pathId);

  const graded = gradeQuiz(quiz, answers);
  const completedAt = new Date();
  const previousAttempts = await QuizAttempt.countDocuments({ userId, quizId: quiz._id });

  await QuizAttempt.create({
    userId,
    quizId: quiz._id,
    lessonId: lesson._id,
    pathId: lesson.pathId,
    answers: graded.storedAnswers,
    score: graded.score,
    correct: graded.correct,
    total: graded.total,
    passed: graded.passed,
    attemptNumber: previousAttempts + 1,
    completedAt,
  });

  if (graded.passed) {
    await UserProgress.findOneAndUpdate(
      { userId, lessonId: lesson._id, type: 'quiz' },
      {
        $set: {
          userId,
          pathId: lesson.pathId,
          moduleId: lesson.moduleId,
          lessonId: lesson._id,
          quizId: quiz._id,
          type: 'quiz',
          score: graded.score,
          completed: true,
          completedAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return {
    score: graded.score,
    correct: graded.correct,
    total: graded.total,
    passed: graded.passed,
  };
}

async function fetchLatestResult(userId, lessonSlug) {
  const { lesson, quiz } = await getLessonAndQuiz(lessonSlug);
  await validateEnrollment(userId, lesson.pathId);

  const attempt = await QuizAttempt.findOne({ userId, quizId: quiz._id })
    .select('score correct total passed completedAt')
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

  if (!attempt) {
    throw createError('Quiz result not found.', 404);
  }

  return toResultDto(attempt);
}

module.exports = {
  fetchQuiz,
  submitQuiz,
  fetchLatestResult,
  toQuizDto,
  toResultDto,
};
