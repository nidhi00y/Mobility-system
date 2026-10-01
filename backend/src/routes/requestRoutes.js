const express = require('express');
const {
  createRequest,
  getMyRequests,
  getRequestById,
  getPendingManagerRequests,
  getHrRequests,
  managerApprove,
  managerReject,
  hrApprove,
  hrReject,
} = require('../controllers/requestController');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireLogin, requireRole('EMPLOYEE', 'MANAGER'), createRequest);
router.get('/my', requireLogin, requireRole('EMPLOYEE', 'MANAGER'), getMyRequests);

router.get('/manager/pending', requireLogin, requireRole('MANAGER'), getPendingManagerRequests);
router.patch('/manager/:id/approve', requireLogin, requireRole('MANAGER'), managerApprove);
router.patch('/manager/:id/reject', requireLogin, requireRole('MANAGER'), managerReject);

router.get('/hr/pending', requireLogin, requireRole('HR'), getHrRequests);
router.patch('/hr/:id/approve', requireLogin, requireRole('HR'), hrApprove);
router.patch('/hr/:id/reject', requireLogin, requireRole('HR'), hrReject);

router.get('/:id', requireLogin, getRequestById);

module.exports = router;
