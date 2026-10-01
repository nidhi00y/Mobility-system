const express = require('express');
const { getHrRequests, hrApprove, hrReject } = require('../controllers/requestController');
const {
	getEligibleRequests,
	createCarPool,
	confirmRequestsSeparately,
	confirmSingleRequest,
	confirmRequestsAsPool,
	getPools,
	getPoolById,
} = require('../controllers/poolController');
const { requireLogin, requireRole } = require('../middleware/auth');
const { getHrAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/analytics', requireLogin, requireRole('HR'), getHrAnalytics);
router.get('/requests', requireLogin, requireRole('HR'), getHrRequests);
router.patch('/requests/:id/approve', requireLogin, requireRole('HR'), hrApprove);
router.patch('/requests/:id/reject', requireLogin, requireRole('HR'), hrReject);
router.post('/requests/:id/confirm', requireLogin, requireRole('HR'), confirmSingleRequest);
router.post('/requests/confirm-all', requireLogin, requireRole('HR'), confirmRequestsSeparately);
router.post('/requests/confirm-pool', requireLogin, requireRole('HR'), confirmRequestsAsPool);

router.get('/pooling/eligible', requireLogin, requireRole('HR'), getEligibleRequests);
router.post('/pooling', requireLogin, requireRole('HR'), createCarPool);
router.get('/pooling', requireLogin, requireRole('HR'), getPools);
router.get('/pooling/:id', requireLogin, requireRole('HR'), getPoolById);

module.exports = router;
