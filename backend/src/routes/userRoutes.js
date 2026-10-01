const express = require('express');
const { getUsers, createUser, getUserById, updateUser } = require('../controllers/userController');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, requireRole('HR'), getUsers);
router.post('/', requireLogin, requireRole('HR'), createUser);
router.get('/:id', requireLogin, requireRole('HR'), getUserById);
router.patch('/:id', requireLogin, requireRole('HR'), updateUser);

module.exports = router;
