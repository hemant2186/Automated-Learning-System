const CodingExercise = require('../models/CodingExercise');
const CodeSubmission = require('../models/CodeSubmission');
const codeExecutionService = require('../services/codeExecutionService');
const { recordActivity } = require('../services/activityService');
const UserProgress = require('../models/UserProgress');

function exerciseDto(exercise) {
  return {
    id: exercise._id.toString(),
    lessonId: exercise.lessonId.toString(),
    title: exercise.title,
    language: exercise.language,
    prompt: exercise.prompt,
    starterCode: exercise.starterCode,
    testCases: exercise.testCases
      .filter((testCase) => !testCase.hidden)
      .map((testCase) => ({ input: testCase.input, expectedOutput: testCase.expectedOutput })),
  };
}

async function getExerciseByLesson(req, res) {
  try {
    const exercise = await CodingExercise.findOne({ lessonId: req.params.lessonId, isPublished: true })
      .select('_id lessonId title language prompt starterCode testCases').lean();
    if (!exercise) return res.status(404).json({ error: 'Coding exercise not found.' });
    return res.json(exerciseDto(exercise));
  } catch (error) {
    return res.status(500).json({ error: 'Could not load coding exercise.' });
  }
}

async function submitCode(req, res) {
  try {
    const { code, timeSpentSeconds } = req.body || {};
    if (typeof code !== 'string') return res.status(400).json({ error: 'Code is required.' });

    const exercise = await CodingExercise.findOne({ _id: req.params.exerciseId, isPublished: true }).lean();
    if (!exercise) return res.status(404).json({ error: 'Coding exercise not found.' });

    const execution = await codeExecutionService.runAgainstTestCases({
      language: exercise.language,
      code,
      testCases: exercise.testCases,
    });
    const score = execution.totalCount > 0
      ? Math.round((execution.passedCount / execution.totalCount) * 100)
      : 0;
    const passed = score === 100;
    const attemptNumber = await CodeSubmission.countDocuments({
      userId: req.user._id,
      exerciseId: exercise._id,
    }) + 1;

    await CodeSubmission.create({
      userId: req.user._id,
      exerciseId: exercise._id,
      lessonId: exercise.lessonId,
      pathId: exercise.pathId,
      code,
      language: exercise.language,
      testResults: execution.results,
      score,
      passed,
      attemptNumber,
    });
    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, lessonId: exercise.lessonId, type: 'code-exercise' },
      { $set: { userId: req.user._id, pathId: exercise.pathId, lessonId: exercise.lessonId, type: 'code-exercise', completed: passed, score, completedAt: passed ? new Date() : null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const seconds = Number(timeSpentSeconds);
    await recordActivity({
      userId: req.user._id,
      topic: exercise.topic,
      quizScore: 0,
      codingScore: score,
      timeSpent: Math.round(Number.isFinite(seconds) ? seconds / 60 : 0),
      attempts: attemptNumber,
      completed: passed,
    });

    const testResults = execution.results.map((result) => result.hidden
      ? { passed: result.passed, hidden: true }
      : result);
    return res.status(201).json({ score, passed, testResults });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || 'Could not submit coding exercise.' });
  }
}

module.exports = { getExerciseByLesson, submitCode };