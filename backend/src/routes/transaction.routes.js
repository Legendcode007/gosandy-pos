const router = require('express').Router();
const { createTransaction, confirmTransaction, cancelTransaction, getTransactions, getTransaction } = require('../controllers/transaction.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',              getTransactions);
router.post('/',             createTransaction);
router.get('/:id',           getTransaction);
router.put('/:id/confirm',   authorize('BOSS', 'ADMIN'), confirmTransaction);
router.put('/:id/cancel',    cancelTransaction);

module.exports = router;
