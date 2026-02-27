const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// This makes the final URL: /api/auth/register
router.post('/register', authController.register); 
router.post('/login', authController.login);

module.exports = router;