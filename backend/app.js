const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const recommendationRoutes = require('./routes/recommendation');
const instructorRoutes = require('./routes/instructor');
const catalogRoutes = require('./routes/catalog');
const pathsRoutes = require('./routes/paths');
const lessonsRoutes = require('./routes/lessons');
const quizzesRoutes = require('./routes/quizzes');
const progressRoutes = require('./routes/progress');
const resourcesRoutes = require('./routes/resources');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');
const personalizationRoutes = require('./routes/personalization');
const codeExercisesRoutes = require('./routes/codeExercises');

dotenv.config({ path: path.join(__dirname, '.env') });
const PORT = process.env.PORT || 5000;

function createApp() {
  const app = express();
  const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/instructor', instructorRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/paths', pathsRoutes);
  app.use('/api/lessons', lessonsRoutes);
  app.use('/api/quizzes', quizzesRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/resources', resourcesRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/personalization', personalizationRoutes);
  app.use('/api/code-exercises', codeExercisesRoutes);

  app.get('/', (req, res) => {
    res.send('API Running');
  });

  return app;
}

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB Atlas connected');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
