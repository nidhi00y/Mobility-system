const express = require('express');
const { getPendingManagerRequests, managerApprove, managerReject } = require('../controllers/requestController');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/requests', requireLogin, requireRole('MANAGER'), getPendingManagerRequests);
router.patch('/requests/:id/approve', requireLogin, requireRole('MANAGER'), managerApprove);
router.patch('/requests/:id/reject', requireLogin, requireRole('MANAGER'), managerReject);

module.exports = router;
