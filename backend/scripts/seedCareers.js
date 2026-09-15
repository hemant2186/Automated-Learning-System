const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Career = require('../models/Career');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const careers = [
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    description:
      'Build the practical skills needed to analyze data, communicate insights, create dashboards, and prepare for entry-level data analyst roles.',
    category: 'data',
    difficulty: 'beginner',
    estimatedWeeks: 16,
    targetRoles: ['Data Analyst', 'BI Analyst', 'Product Analyst', 'Marketing Analyst'],
    skills: [
      { key: 'excel', title: 'Excel', order: 1, importance: 'core', masteryTarget: 75 },
      { key: 'statistics', title: 'Statistics', order: 2, importance: 'core', prerequisites: ['excel'], masteryTarget: 75 },
      { key: 'sql', title: 'SQL', order: 3, importance: 'core', prerequisites: ['excel'], masteryTarget: 80 },
      { key: 'python', title: 'Python', order: 4, importance: 'supporting', prerequisites: ['statistics'], masteryTarget: 70 },
      { key: 'pandas', title: 'Pandas', order: 5, importance: 'supporting', prerequisites: ['python', 'sql'], masteryTarget: 70 },
      { key: 'data-visualization', title: 'Data Visualization', order: 6, importance: 'core', prerequisites: ['statistics'], masteryTarget: 75 },
      { key: 'power-bi', title: 'Power BI', order: 7, importance: 'core', prerequisites: ['sql', 'data-visualization'], masteryTarget: 75 },
      { key: 'projects', title: 'Portfolio Projects', order: 8, importance: 'core', prerequisites: ['sql', 'data-visualization', 'power-bi'], masteryTarget: 80 },
      { key: 'interviews', title: 'Interview Readiness', order: 9, importance: 'core', prerequisites: ['sql', 'statistics', 'projects'], masteryTarget: 75 }
    ],
    isPublished: true
  }
];

async function seedCareers() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  for (const career of careers) {
    await Career.updateOne({ slug: career.slug }, { $set: career }, { upsert: true });
  }
  console.log(`Seeded ${careers.length} careers.`);
  await mongoose.disconnect();
}

seedCareers().catch(async (error) => {
  console.error('Career seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
