const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/branches',     require('./routes/branch.routes'));
app.use('/api/users',        require('./routes/user.routes'));
app.use('/api/services',     require('./routes/service.routes'));
app.use('/api/stationery',   require('./routes/stationery.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/receipts',     require('./routes/receipt.routes'));
app.use('/api/reports',      require('./routes/report.routes'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: process.env.APP_NAME || 'Gosandy POS',
    timestamp: new Date().toISOString(),
  });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🟢 Gosandy POS Server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
