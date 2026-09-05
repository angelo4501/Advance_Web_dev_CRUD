require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const publicDir = path.join(__dirname, 'public');

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set');
    return;
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

connectDatabase().catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});
app.use(express.static(publicDir));

app.get('/about', (_req, res) => {
  res.sendFile(path.join(publicDir, 'about.html'));
});
app.get('/api/health', async (_req, res) => {
  const readyState = mongoose.connection.readyState;
  let status = readyState === 1 ? 'online' : readyState === 2 ? 'connecting' : 'offline';
  if (readyState === 1) {
    try {
      await mongoose.connection.db.admin().command({ ping: 1 });
    } catch {
      status = 'offline';
    }
  }
  res.status(status === 'online' ? 200 : 503).json({
    database: 'MongoDB',
    status,
    readyState,
  });
});
app.use('/api/items', itemRoutes);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
