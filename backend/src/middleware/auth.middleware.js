const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// ─── Verify JWT Token ──────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Role Guard ────────────────────────────────────────────────
// Usage: authorize('BOSS') or authorize('BOSS', 'ADMIN')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// ─── Branch isolation guard ────────────────────────────────────
// Ensures ADMIN can only see their own branch data
// BOSS can see all branches
const branchGuard = (req, res, next) => {
  const { branchId } = req.params;
  const user = req.user;

  if (user.role === 'BOSS') return next(); // Boss sees everything

  if (user.role === 'ADMIN' || user.role === 'STAFF') {
    if (branchId && branchId !== user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access data from your own branch',
      });
    }
  }
  next();
};

module.exports = { authenticate, authorize, branchGuard };
