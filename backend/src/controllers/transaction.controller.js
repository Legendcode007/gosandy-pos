const prisma = require('../config/prisma');

// ─── Create Transaction (Staff / Admin / Boss) ────────────────
const createTransaction = async (req, res) => {
  try {
    const { customerName, items, notes } = req.body;
    const { user } = req;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Validate and price each item
    let totalAmount = 0;
    const itemsToCreate = [];

    for (const item of items) {
      const { itemType, itemId, quantity } = item;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }

      if (itemType === 'SERVICE') {
        const service = await prisma.service.findUnique({ where: { id: itemId } });
        if (!service || !service.isActive) {
          return res.status(404).json({ success: false, message: `Service not found: ${itemId}` });
        }
        const subtotal = parseFloat(service.unitPrice) * quantity;
        totalAmount += subtotal;
        itemsToCreate.push({
          itemType: 'SERVICE',
          serviceId: itemId,
          itemName: service.name,
          quantity,
          unitPrice: service.unitPrice,
          subtotal,
        });

      } else if (itemType === 'STATIONERY') {
        const stationery = await prisma.stationeryItem.findUnique({ where: { id: itemId } });
        if (!stationery || !stationery.isActive) {
          return res.status(404).json({ success: false, message: `Item not found: ${itemId}` });
        }
        if (stationery.quantityInStock < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${stationery.name}". Available: ${stationery.quantityInStock}`,
          });
        }
        const subtotal = parseFloat(stationery.unitPrice) * quantity;
        totalAmount += subtotal;
        itemsToCreate.push({
          itemType: 'STATIONERY',
          stationeryItemId: itemId,
          itemName: stationery.name,
          quantity,
          unitPrice: stationery.unitPrice,
          subtotal,
        });
      } else {
        return res.status(400).json({ success: false, message: `Invalid itemType: ${itemType}` });
      }
    }

    // Create transaction with items in one DB call
    const transaction = await prisma.transaction.create({
      data: {
        customerName,
        totalAmount,
        status: 'PENDING',
        notes,
        branchId: user.branchId,
        staffId: user.id,
        items: { create: itemsToCreate },
      },
      include: { items: true, staff: { select: { id: true, fullName: true } } },
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded. Awaiting cashier confirmation.',
      data: transaction,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ success: false, message: 'Could not create transaction' });
  }
};

// ─── Confirm Transaction (Admin / Boss acting as cashier) ─────
const confirmTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;
    const { user } = req;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Transaction is already ${transaction.status.toLowerCase()}` });
    }

    // Branch isolation: Admin can only confirm from their branch
    if (user.role === 'ADMIN' && transaction.branchId !== user.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const total = parseFloat(transaction.totalAmount);
    const paid = parseFloat(amountPaid);

    if (paid < total) {
      return res.status(400).json({
        success: false,
        message: `Amount paid (₵${paid.toFixed(2)}) is less than total (₵${total.toFixed(2)})`,
      });
    }

    const balance = paid - total;

    // Confirm transaction & deduct stationery stock in a DB transaction
    const [confirmed] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id },
        data: {
          amountPaid: paid,
          balance,
          status: 'CONFIRMED',
          cashierId: user.id,
          confirmedAt: new Date(),
        },
        include: {
          items: true,
          staff: { select: { id: true, fullName: true } },
          cashier: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      // Deduct stock for each stationery item
      ...transaction.items
        .filter(i => i.itemType === 'STATIONERY')
        .map(i =>
          prisma.stationeryItem.update({
            where: { id: i.stationeryItemId },
            data: { quantityInStock: { decrement: i.quantity } },
          })
        ),
    ]);

    // Log stock movements for stationery
    const stationeryItems = transaction.items.filter(i => i.itemType === 'STATIONERY');
    if (stationeryItems.length > 0) {
      await prisma.stockMovement.createMany({
        data: stationeryItems.map(i => ({
          type: 'SALE',
          quantity: -i.quantity,
          note: `Sale - Transaction ${id}`,
          stationeryItemId: i.stationeryItemId,
          branchId: transaction.branchId,
          recordedById: user.id,
        })),
      });
    }

    res.json({
      success: true,
      message: `Transaction confirmed. Change: ₵${balance.toFixed(2)}`,
      data: confirmed,
    });
  } catch (err) {
    console.error('Confirm transaction error:', err);
    res.status(500).json({ success: false, message: 'Could not confirm transaction' });
  }
};

// ─── Cancel Transaction ───────────────────────────────────────
const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only pending transactions can be cancelled' });
    }

    // Staff can only cancel their own transactions
    if (user.role === 'STAFF' && transaction.staffId !== user.id) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own transactions' });
    }

    await prisma.transaction.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, message: 'Transaction cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not cancel transaction' });
  }
};

// ─── Get Transactions (scoped by role) ────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { user } = req;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};

    // Scope by role
    if (user.role === 'STAFF') {
      where.staffId = user.id;
    } else if (user.role === 'ADMIN') {
      where.branchId = user.branchId;
    }
    // BOSS sees all

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, transactions] = await prisma.$transaction([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          items: true,
          staff: { select: { id: true, fullName: true } },
          cashier: { select: { id: true, fullName: true } },
          branch: { select: { id: true, name: true } },
          receipt: { select: { id: true, receiptNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch transactions' });
  }
};

// ─── Get Single Transaction ───────────────────────────────────
const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
        staff: { select: { id: true, fullName: true } },
        cashier: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true, location: true } },
        receipt: true,
      },
    });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Access control
    if (user.role === 'STAFF' && transaction.staffId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (user.role === 'ADMIN' && transaction.branchId !== user.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch transaction' });
  }
};

module.exports = {
  createTransaction,
  confirmTransaction,
  cancelTransaction,
  getTransactions,
  getTransaction,
};
