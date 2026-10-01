const express = require('express');
const { getEligibleRequests, createCarPool, getPools, getPoolById } = require('../controllers/poolController');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/eligible', requireLogin, requireRole('HR'), getEligibleRequests);
router.post('/', requireLogin, requireRole('HR'), createCarPool);
router.get('/', requireLogin, requireRole('HR'), getPools);
router.get('/:id', requireLogin, requireRole('HR'), getPoolById);

module.exports = router;
