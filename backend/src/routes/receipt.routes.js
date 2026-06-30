const router = require('express').Router();
const { generateReceipt, getReceipt } = require('../controllers/receipt.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/:transactionId',        getReceipt);
router.get('/:transactionId/pdf',    generateReceipt);

module.exports = router;
