const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

// ─── Get All Users ────────────────────────────────────────────
// BOSS: all users | ADMIN: own branch only
const getAllUsers = async (req, res) => {
  try {
    const { user } = req;
    const where = {};

    if (user.role === 'ADMIN') {
      where.branchId = user.branchId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users' });
  }
};

// ─── Get Single User ──────────────────────────────────────────
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user: requester } = req;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Admin can only view users in their branch
    if (requester.role === 'ADMIN' && user.branch?.id !== requester.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user' });
  }
};

// ─── Update User (role, branch, active status) ────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, role, branchId, isActive } = req.body;
    const { user: requester } = req;

    // Admin cannot assign BOSS role
    if (requester.role === 'ADMIN' && role === 'BOSS') {
      return res.status(403).json({ success: false, message: 'Admins cannot assign the Boss role' });
    }

    // Admin cannot modify users outside their branch
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    if (requester.role === 'ADMIN' && target.branchId !== requester.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updateData = { fullName, phone, isActive };
    if (requester.role === 'BOSS') {
      updateData.role = role;
      updateData.branchId = branchId;
    } else if (requester.role === 'ADMIN') {
      updateData.role = role === 'BOSS' ? undefined : role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, fullName: true, email: true, role: true,
        isActive: true, branchId: true,
      },
    });

    res.json({ success: true, message: 'User updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update user' });
  }
};

// ─── Assign Branch & Role to New User ────────────────────────
const assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId, role } = req.body;
    const { user: requester } = req;

    if (requester.role === 'ADMIN') {
      if (branchId !== requester.branchId) {
        return res.status(403).json({ success: false, message: 'You can only assign users to your own branch' });
      }
      if (role === 'BOSS') {
        return res.status(403).json({ success: false, message: 'Admins cannot assign the Boss role' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { branchId, role },
      select: { id: true, fullName: true, email: true, role: true, branchId: true },
    });

    res.json({ success: true, message: 'User assigned successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not assign user' });
  }
};

// ─── Deactivate User ──────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not deactivate user' });
  }
};

module.exports = { getAllUsers, getUser, updateUser, assignUser, deactivateUser };
