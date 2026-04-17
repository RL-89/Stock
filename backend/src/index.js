require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const stockRoutes = require('./routes/stocks');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./scheduler/DataRefreshScheduler');

const app = express();
const PORT = process.env.PORT || 3001;
const DIST = path.resolve(__dirname, '../../frontend/dist');
const serveStatic = fs.existsSync(DIST);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
if (!serveStatic) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'DELETE'],
  }));
}
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

// Serve built frontend from the same port
if (serveStatic) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
  console.log(`[Alpha Engine] Serving frontend from ${DIST}`);
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Alpha Engine] Running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    scheduler.start();
  }
});

module.exports = app;
