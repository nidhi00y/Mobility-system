const express = require('express');
const { login, logout, whoAmI } = require('../controllers/authController');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireLogin, logout);
router.get('/me', requireLogin, whoAmI);

module.exports = router;
