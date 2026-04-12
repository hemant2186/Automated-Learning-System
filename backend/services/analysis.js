// Topics sequence
const TOPICS = [
  'Computer Basics',
  'Variables and Data Types',
  'Operators',
  'Control Structures',
  'Loops',
  'Functions',
  'Arrays',
  'Objects',
  'Classes',
  'Web Development Basics'
];

// Calculate mastery
function calculateMastery(quizScore, codingScore, timeSpent, attempts) {
  let score = (0.4 * (quizScore || 0)) + (0.45 * (codingScore || 0));
  const timePenalty = Math.max(0, (timeSpent - 20) * 0.5); // assume 20 min ideal
  const attemptsPenalty = (attempts - 1) * 5;
  score = Math.max(0, score - timePenalty - attemptsPenalty + 15);
  return Math.min(100, score);
}

// Get status
function getStatus(mastery) {
  if (mastery >= 80) return 'strong';
  if (mastery >= 50) return 'developing';
  return 'weak';
}

module.exports = { TOPICS, calculateMastery, getStatus };