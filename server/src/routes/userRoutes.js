const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // Use your existing auth middleware

// This route gets the logged-in user's data
router.get('/profile', auth, userController.getProfile);

module.exports = router;