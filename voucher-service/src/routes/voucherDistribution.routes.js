const express = require('express');
const router = express.Router();
const voucherDistributionController = require('../controllers/voucherDistribution.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/permission.middleware');

// All routes require authentication and admin/employee role
router.use(verifyToken);
router.use(authorize(['admin', 'employee']));

router.get('/', voucherDistributionController.getAllDistributions);
router.get('/stats', voucherDistributionController.getDistributionStats);
router.get('/user/:userId', voucherDistributionController.getDistributionsByUser);
router.get('/:id', voucherDistributionController.getDistributionById);

module.exports = router;

