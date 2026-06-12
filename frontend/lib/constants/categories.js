export const PATH_CATEGORIES = [
  {
    id: 'programming-languages',
    label: 'Programming Languages',
    description: 'Core language fundamentals from Python to Rust.',
  },
  {
    id: 'web-development',
    label: 'Web Development',
    description: 'Frontend, full-stack, and modern web frameworks.',
  },
  {
    id: 'backend-development',
    label: 'Backend Development',
    description: 'APIs, servers, databases, and backend frameworks.',
  },
  {
    id: 'data-structures-algorithms',
    label: 'Data Structures & Algorithms',
    description: 'Problem-solving patterns for interviews and competitions.',
  },
  {
    id: 'ai-machine-learning',
    label: 'AI & Machine Learning',
    description: 'Data science, ML, deep learning, and LLM fundamentals.',
  },
  {
    id: 'devops',
    label: 'DevOps',
    description: 'Git, cloud, containers, and deployment pipelines.',
  },
];

export const PATH_CATEGORY_IDS = PATH_CATEGORIES.map((category) => category.id);

export function getCategoryById(id) {
  return PATH_CATEGORIES.find((category) => category.id === id) || null;
}
