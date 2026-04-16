require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const stockRoutes = require('./routes/stocks');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./scheduler/DataRefreshScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'DELETE'],
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/stocks', stockRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Alpha Engine] Backend running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    scheduler.start();
  }
});

module.exports = app;
