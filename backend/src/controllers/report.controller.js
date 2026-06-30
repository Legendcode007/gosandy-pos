const prisma = require('../config/prisma');

// ─── Dashboard Summary (role-aware) ───────────────────────────
const getDashboard = async (req, res) => {
  try {
    const { user } = req;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const baseWhere = { status: 'CONFIRMED' };

    if (user.role === 'STAFF') baseWhere.staffId = user.id;
    else if (user.role === 'ADMIN') baseWhere.branchId = user.branchId;

    const [todaySales, monthSales, totalSales, pendingCount, recentTransactions] = await prisma.$transaction([
      // Today's confirmed sales
      prisma.transaction.aggregate({
        where: { ...baseWhere, createdAt: { gte: startOfDay } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      // This month's sales
      prisma.transaction.aggregate({
        where: { ...baseWhere, createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      // All-time sales
      prisma.transaction.aggregate({
        where: baseWhere,
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Pending transactions
      prisma.transaction.count({
        where: { ...baseWhere, status: 'PENDING' },
      }),
      // Recent 5 transactions
      prisma.transaction.findMany({
        where: user.role === 'STAFF' ? { staffId: user.id } : user.role === 'ADMIN' ? { branchId: user.branchId } : {},
        include: {
          staff: { select: { fullName: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        today: {
          sales: parseFloat(todaySales._sum.totalAmount || 0),
          transactions: todaySales._count,
        },
        thisMonth: {
          sales: parseFloat(monthSales._sum.totalAmount || 0),
          transactions: monthSales._count,
        },
        allTime: {
          sales: parseFloat(totalSales._sum.totalAmount || 0),
          transactions: totalSales._count,
        },
        pendingCount,
        recentTransactions,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Could not load dashboard' });
  }
};

// ─── Branch Sales Report (BOSS / ADMIN) ──────────────────────
const getBranchReport = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;
    const { user } = req;

    // Admin can only view their own branch
    if (user.role === 'ADMIN' && branchId !== user.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { branchId, status: 'CONFIRMED' };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [salesSummary, topStaff, serviceBreakdown] = await prisma.$transaction([
      prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      // Top performing staff in branch
      prisma.transaction.groupBy({
        by: ['staffId'],
        where,
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
      // Item type breakdown
      prisma.transactionItem.groupBy({
        by: ['itemType'],
        where: { transaction: where },
        _sum: { subtotal: true },
        _count: true,
      }),
    ]);

    // Resolve staff names
    const staffIds = topStaff.map(s => s.staffId);
    const staffUsers = await prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, fullName: true },
    });
    const staffMap = Object.fromEntries(staffUsers.map(u => [u.id, u.fullName]));

    res.json({
      success: true,
      data: {
        summary: {
          totalSales: parseFloat(salesSummary._sum.totalAmount || 0),
          totalTransactions: salesSummary._count,
        },
        topStaff: topStaff.map(s => ({
          staffId: s.staffId,
          staffName: staffMap[s.staffId] || 'Unknown',
          totalSales: parseFloat(s._sum.totalAmount || 0),
          transactions: s._count,
        })),
        serviceBreakdown: serviceBreakdown.map(s => ({
          type: s.itemType,
          totalSales: parseFloat(s._sum.subtotal || 0),
          count: s._count,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not generate branch report' });
  }
};

// ─── All Branches Overview (BOSS only) ───────────────────────
const getAllBranchesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { status: 'CONFIRMED' };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [overallSummary, branchSales] = await prisma.$transaction([
      prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['branchId'],
        where,
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
    ]);

    // Resolve branch names
    const branchIds = branchSales.map(b => b.branchId);
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true, location: true },
    });
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b]));

    res.json({
      success: true,
      data: {
        overall: {
          totalSales: parseFloat(overallSummary._sum.totalAmount || 0),
          totalTransactions: overallSummary._count,
        },
        branches: branchSales.map(b => ({
          branchId: b.branchId,
          branchName: branchMap[b.branchId]?.name || 'Unknown',
          location: branchMap[b.branchId]?.location || '',
          totalSales: parseFloat(b._sum.totalAmount || 0),
          transactions: b._count,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not generate overview report' });
  }
};

// ─── Staff Performance (STAFF: own, ADMIN/BOSS: their branch) ─
const getStaffPerformance = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;
    const { user } = req;

    // Staff can only view their own performance
    if (user.role === 'STAFF' && staffId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const staffUser = await prisma.user.findUnique({
      where: { id: staffId },
      select: { id: true, fullName: true, branchId: true },
    });
    if (!staffUser) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Admin can only see staff from their branch
    if (user.role === 'ADMIN' && staffUser.branchId !== user.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { staffId, status: 'CONFIRMED' };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [summary, byDay] = await prisma.$transaction([
      prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where,
        select: { totalAmount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        staff: { id: staffUser.id, fullName: staffUser.fullName },
        summary: {
          totalSales: parseFloat(summary._sum.totalAmount || 0),
          totalTransactions: summary._count,
        },
        history: byDay.map(t => ({
          date: t.createdAt,
          amount: parseFloat(t.totalAmount),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch staff performance' });
  }
};

module.exports = { getDashboard, getBranchReport, getAllBranchesReport, getStaffPerformance };
