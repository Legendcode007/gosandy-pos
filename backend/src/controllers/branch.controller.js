const prisma = require('../config/prisma');

// ─── Create Branch (BOSS only) ────────────────────────────────
const createBranch = async (req, res) => {
  try {
    const { name, location, phone } = req.body;
    if (!name || !location) {
      return res.status(400).json({ success: false, message: 'Branch name and location are required' });
    }

    const branch = await prisma.branch.create({ data: { name, location, phone } });
    res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create branch' });
  }
};

// ─── Get All Branches ─────────────────────────────────────────
const getAllBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { users: true, transactions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch branches' });
  }
};

// ─── Get Single Branch ────────────────────────────────────────
const getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
          select: { id: true, fullName: true, email: true, role: true, createdAt: true },
        },
        _count: { select: { transactions: true } },
      },
    });

    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch branch' });
  }
};

// ─── Update Branch ────────────────────────────────────────────
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, phone, isActive } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: { name, location, phone, isActive },
    });
    res.json({ success: true, message: 'Branch updated', data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update branch' });
  }
};

// ─── Delete (Deactivate) Branch ───────────────────────────────
const deactivateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.branch.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Branch deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not deactivate branch' });
  }
};

module.exports = { createBranch, getAllBranches, getBranch, updateBranch, deactivateBranch };
