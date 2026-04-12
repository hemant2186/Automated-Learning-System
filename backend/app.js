const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const recommendationRoutes = require('./routes/recommendation');
const instructorRoutes = require('./routes/instructor');

dotenv.config({ path: path.join(__dirname, '.env') });
const PORT = process.env.PORT || 5000;

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/instructor', instructorRoutes);

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
