export const ONBOARDING_GOALS = [
  {
    id: 'python-developer',
    label: 'Python Developer',
    description: 'Build apps and automation with Python.',
  },
  {
    id: 'frontend-developer',
    label: 'Frontend Developer',
    description: 'Create modern interfaces with HTML, CSS, and React.',
  },
  {
    id: 'backend-developer',
    label: 'Backend Developer',
    description: 'Design APIs, databases, and server-side systems.',
  },
  {
    id: 'full-stack-developer',
    label: 'Full Stack Developer',
    description: 'Ship complete products across frontend and backend.',
  },
  {
    id: 'ai-engineer',
    label: 'AI Engineer',
    description: 'Work with ML models, data pipelines, and LLMs.',
  },
  {
    id: 'data-scientist',
    label: 'Data Scientist',
    description: 'Analyze data and build predictive models.',
  },
  {
    id: 'competitive-programmer',
    label: 'Competitive Programmer',
    description: 'Master DSA for contests and technical interviews.',
  },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const STUDY_HOURS_OPTIONS = [
  { id: 1, label: '1 hour / day' },
  { id: 2, label: '2 hours / day' },
  { id: 3, label: '3 hours / day' },
  { id: 4, label: '4+ hours / day' },
];

export function getGoalById(id) {
  return ONBOARDING_GOALS.find((goal) => goal.id === id) || null;
}
