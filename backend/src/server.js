require('dotenv').config({ path: '../.env' });
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');
const { initializeDatabase } = require('./db/schema');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const managerRoutes = require('./routes/managerRoutes');
const hrRoutes = require('./routes/hrRoutes');
const poolRoutes = require('./routes/poolRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr/pooling', poolRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
