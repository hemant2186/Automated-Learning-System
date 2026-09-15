const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Career = require('../models/Career');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const free = (title, url, provider, type, whyRecommended, preferred = false, estimatedHours = 0) => ({
  title,
  url,
  provider,
  type,
  free: true,
  preferred,
  estimatedHours,
  whyRecommended,
});

const careers = [
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    description:
      'Build practical skills to analyze data, communicate insights, create dashboards, and prepare for entry-level analyst roles.',
    category: 'data',
    difficulty: 'beginner',
    estimatedWeeks: 16,
    targetRoles: ['Data Analyst', 'BI Analyst', 'Product Analyst', 'Marketing Analyst'],
    skills: [
      {
        key: 'excel', title: 'Excel', order: 1, importance: 'core', topicKeywords: ['excel', 'spreadsheets', 'microsoft excel'], masteryTarget: 75,
        resources: [
          free('Excel Training - Beginner Level', 'https://www.youtube.com/watch?v=ZL08jtjGEz4', 'YouTube • La minute Excel', 'video', 'A beginner-friendly walkthrough covering navigation, formulas, functions, formatting, and a practical budget exercise.', true, 1),
        ],
      },
      {
        key: 'statistics', title: 'Statistics', order: 2, importance: 'core', prerequisites: ['excel'], topicKeywords: ['statistics', 'probability', 'descriptive statistics'], masteryTarget: 75,
        resources: [
          free('Statistics study path', 'https://www.khanacademy.org/math/statistics-probability', 'Khan Academy', 'course', 'Free self-paced practice for descriptive statistics and probability foundations useful for analyst work.', true, 12),
        ],
      },
      {
        key: 'sql', title: 'SQL', order: 3, importance: 'core', prerequisites: ['excel'], topicKeywords: ['sql', 'database', 'queries', 'mysql'], masteryTarget: 80,
        resources: [
          free('SQL Tutorial - Full Database Course for Beginners', 'https://www.youtube.com/watch?v=HXV3zeQKqGY', 'YouTube • freeCodeCamp.org', 'video', 'A long-form beginner course covering queries, aggregation, joins, nested queries, schemas, and more.', true, 4),
          free('Intro to SQL', 'https://www.kaggle.com/learn/intro-to-sql', 'Kaggle Learn', 'practice', 'Free browser-based SQL exercises with immediate practice, useful after the fundamentals course.', false, 3),
        ],
      },
      {
        key: 'python', title: 'Python', order: 4, importance: 'supporting', prerequisites: ['statistics'], topicKeywords: ['python', 'python fundamentals', 'programming'], masteryTarget: 70,
        resources: [
          free('Python', 'https://www.kaggle.com/learn/python', 'Kaggle Learn', 'course', 'Free hands-on Python lessons covering syntax, functions, conditionals, lists, loops, dictionaries, and libraries.', true, 5),
        ],
      },
      {
        key: 'pandas', title: 'Pandas', order: 5, importance: 'supporting', prerequisites: ['python', 'sql'], topicKeywords: ['pandas', 'dataframes', 'data wrangling'], masteryTarget: 70,
        resources: [
          free('Pandas', 'https://www.kaggle.com/learn/pandas', 'Kaggle Learn', 'course', 'Free hands-on exercises for reading data, indexing, grouping, sorting, missing values, combining, and transformation.', true, 4),
          free('Data Cleaning', 'https://www.kaggle.com/learn/data-cleaning', 'Kaggle Learn', 'course', 'Free practical exercises for missing values, date parsing, scaling, encodings, and inconsistent data.', false, 4),
        ],
      },
      {
        key: 'data-visualization', title: 'Data Visualization', order: 6, importance: 'core', prerequisites: ['statistics'], topicKeywords: ['data visualization', 'visualization', 'charts', 'data viz'], masteryTarget: 75,
        resources: [
          free('Kaggle Learn', 'https://www.kaggle.com/learn', 'Kaggle Learn', 'course', 'Free data visualization courses and hands-on notebooks; useful for practicing charts and communicating findings.', true, 4),
        ],
      },
      {
        key: 'power-bi', title: 'Power BI', order: 7, importance: 'core', prerequisites: ['sql', 'data-visualization'], topicKeywords: ['power bi', 'powerbi', 'business intelligence', 'bi dashboards'], masteryTarget: 75,
        resources: [
          free('Prepare and visualize data with Power BI', 'https://learn.microsoft.com/en-us/training/paths/prepare-visualize-data-power-bi/', 'Microsoft Learn', 'course', 'Official beginner learning path for data analysts covering data import, transformation, modeling, and report creation.', true, 8),
          free('Power BI learning directory', 'https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-learning-path-directory', 'Microsoft Learn', 'documentation', 'Official scenario-based map for moving from beginner Power BI skills to analyst workflows.', false, 4),
        ],
      },
      {
        key: 'projects', title: 'Portfolio Projects', order: 8, importance: 'core', prerequisites: ['sql', 'data-visualization', 'power-bi'], topicKeywords: ['projects', 'portfolio', 'case study', 'data project'], masteryTarget: 80,
        resources: [
          free('Kaggle Learn', 'https://www.kaggle.com/learn', 'Kaggle Learn', 'project', 'Free notebooks and datasets provide a practical environment for applying analysis skills to real datasets.', true, 8),
        ],
      },
      {
        key: 'interviews', title: 'Interview Readiness', order: 9, importance: 'core', prerequisites: ['sql', 'statistics', 'projects'], topicKeywords: ['interviews', 'interview', 'behavioral interview', 'technical interview'], masteryTarget: 75,
        resources: [
          free('Striver A2Z DSA Sheet', 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z', 'Take U Forward', 'sheet', 'Free, structured problem-solving practice. This will be reused for software-engineering/DSA career tracks and is a good example of our curated-sheet resource type.', false, 30),
        ],
      },
    ],
    isPublished: true,
  },
];

async function seedCareers() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  for (const career of careers) {
    await Career.updateOne({ slug: career.slug }, { $set: career }, { upsert: true });
  }
  console.log(`Seeded ${careers.length} careers with curated free resources.`);
  await mongoose.disconnect();
}

seedCareers().catch(async (error) => {
  console.error('Career seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
