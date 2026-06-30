const router = require('express').Router();
const { createBranch, getAllBranches, getBranch, updateBranch, deactivateBranch } = require('../controllers/branch.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',           authorize('BOSS', 'ADMIN', 'STAFF'), getAllBranches);
router.post('/',          authorize('BOSS'), createBranch);
router.get('/:id',        authorize('BOSS', 'ADMIN'), getBranch);
router.put('/:id',        authorize('BOSS'), updateBranch);
router.delete('/:id',     authorize('BOSS'), deactivateBranch);

module.exports = router;
