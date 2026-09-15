const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const CareerResource = require('../models/CareerResource');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const resources = [
  {
    careerSlug: 'data-analyst', skillKey: 'excel', title: 'Excel Tutorials for Data Analysts', provider: 'Alex The Analyst',
    url: 'https://www.youtube.com/watch?v=XRPyj7cKVsQ', type: 'video', difficulty: 'beginner', estimatedHours: 1,
    reason: 'Practical Excel formulas and analyst-focused examples.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'statistics', title: 'AP / College Statistics', provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/ap-statistics', type: 'course', difficulty: 'beginner', estimatedHours: 20,
    reason: 'Structured coverage of descriptive statistics, probability, sampling, inference, and regression.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'sql', title: 'SQL Tutorial - Full Database Course for Beginners', provider: 'freeCodeCamp.org',
    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'video', difficulty: 'beginner', estimatedHours: 4,
    reason: 'Full beginner course covering queries, aggregation, joins, nested queries, and database basics.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'python', title: 'Python', provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/python', type: 'course', difficulty: 'beginner', estimatedHours: 5,
    reason: 'Short hands-on Python course designed for data science and data work.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'pandas', title: 'Pandas', provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/pandas', type: 'course', difficulty: 'beginner', estimatedHours: 4,
    reason: 'Hands-on data manipulation practice with real coding exercises.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'data-visualization', title: 'Data Visualization', provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/data-visualization', type: 'course', difficulty: 'beginner', estimatedHours: 4,
    reason: 'Practical visualization exercises for data analysis.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'power-bi', title: 'Prepare and visualize data with Power BI', provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/training/paths/prepare-visualize-data-power-bi/', type: 'course', difficulty: 'beginner', estimatedHours: 8,
    reason: 'Official self-paced path covering data import, transformation, modeling, and interactive reports.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'projects', title: 'Full Project in Excel', provider: 'Alex The Analyst',
    url: 'https://www.youtube.com/watch?v=opJgMj1IUrc', type: 'project', difficulty: 'beginner', estimatedHours: 2,
    reason: 'Guided project covering data cleaning and dashboard creation.', rank: 1,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'projects', title: 'Kaggle Notebooks', provider: 'Kaggle',
    url: 'https://www.kaggle.com/code', type: 'practice', difficulty: 'beginner', estimatedHours: 6,
    reason: 'Use public notebooks and datasets to build independent portfolio projects.', rank: 2,
  },
  {
    careerSlug: 'data-analyst', skillKey: 'interviews', title: 'Data Analyst Learning Path', provider: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/training/career-paths/data-analyst', type: 'course', difficulty: 'intermediate', estimatedHours: 12,
    reason: 'Career-oriented self-paced learning path for data analyst skills and preparation.', rank: 1,
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  for (const item of resources) {
    await CareerResource.updateOne(
      { careerSlug: item.careerSlug, skillKey: item.skillKey, rank: item.rank },
      { $set: item },
      { upsert: true }
    );
  }
  console.log(`Seeded ${resources.length} career resources.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Career resource seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
