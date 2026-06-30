const router = require('express').Router();
const { getAllUsers, getUser, updateUser, assignUser, deactivateUser } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',               authorize('BOSS', 'ADMIN'), getAllUsers);
router.get('/:id',            authorize('BOSS', 'ADMIN'), getUser);
router.put('/:id',            authorize('BOSS', 'ADMIN'), updateUser);
router.put('/:id/assign',     authorize('BOSS', 'ADMIN'), assignUser);
router.put('/:id/deactivate', authorize('BOSS', 'ADMIN'), deactivateUser);

module.exports = router;
