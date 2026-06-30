const router = require('express').Router();
const { getDashboard, getBranchReport, getAllBranchesReport, getStaffPerformance } = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/dashboard',                          getDashboard);
router.get('/overview',                           authorize('BOSS'), getAllBranchesReport);
router.get('/branch/:branchId',                   authorize('BOSS', 'ADMIN'), getBranchReport);
router.get('/staff/:staffId',                     getStaffPerformance);

module.exports = router;
