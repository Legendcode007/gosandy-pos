const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get all stationery for a branch
router.get('/', async (req, res) => {
  try {
    const { user } = req;
    const branchId = req.query.branchId || user.branchId;
    const items = await prisma.stationeryItem.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch stationery' });
  }
});

// Create stationery item
router.post('/', authorize('BOSS', 'ADMIN'), async (req, res) => {
  try {
    const { name, unitPrice, quantityInStock, lowStockAlert } = req.body;
    const branchId = req.body.branchId || req.user.branchId;
    const item = await prisma.stationeryItem.create({
      data: { name, unitPrice: parseFloat(unitPrice), quantityInStock: parseInt(quantityInStock || 0), lowStockAlert: parseInt(lowStockAlert || 5), branchId },
    });
    res.status(201).json({ success: true, message: 'Item created', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create item' });
  }
});

// Update stationery item
router.put('/:id', authorize('BOSS', 'ADMIN'), async (req, res) => {
  try {
    const { name, unitPrice, lowStockAlert, isActive } = req.body;
    const item = await prisma.stationeryItem.update({
      where: { id: req.params.id },
      data: { name, unitPrice: unitPrice ? parseFloat(unitPrice) : undefined, lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : undefined, isActive },
    });
    res.json({ success: true, message: 'Item updated', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update item' });
  }
});

// Add stock
router.post('/:id/stock', authorize('BOSS', 'ADMIN'), async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const qty = parseInt(quantity);
    const [item, movement] = await prisma.$transaction([
      prisma.stationeryItem.update({
        where: { id: req.params.id },
        data: { quantityInStock: { increment: qty } },
      }),
      prisma.stockMovement.create({
        data: { type: 'ADD', quantity: qty, note, stationeryItemId: req.params.id, branchId: req.user.branchId, recordedById: req.user.id },
      }),
    ]);
    res.json({ success: true, message: `Added ${qty} units to stock`, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update stock' });
  }
});

module.exports = router;
