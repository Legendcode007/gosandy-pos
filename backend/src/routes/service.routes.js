const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get all services (all roles)
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch services' });
  }
});

// Create service
router.post('/', authorize('BOSS', 'ADMIN'), async (req, res) => {
  try {
    const { name, category, unitPrice, description, branchId } = req.body;
    const service = await prisma.service.create({
      data: { name, category, unitPrice: parseFloat(unitPrice), description, branchId: branchId || null },
    });
    res.status(201).json({ success: true, message: 'Service created', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create service' });
  }
});

// Update service
router.put('/:id', authorize('BOSS', 'ADMIN'), async (req, res) => {
  try {
    const { name, category, unitPrice, description, isActive } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { name, category, unitPrice: unitPrice ? parseFloat(unitPrice) : undefined, description, isActive },
    });
    res.json({ success: true, message: 'Service updated', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update service' });
  }
});

module.exports = router;
