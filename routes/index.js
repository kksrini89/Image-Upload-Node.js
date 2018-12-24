const express = require('express');
const router = express.Router();

const carRoutes = require('./car-routes');
const authRoutes = require('./auth-routes');

// const carController = require('../controllers/carController');
// const authController = require('../controllers/authController');

router.post('/api/auth', authRoutes);
router.post('/api/car', carRoutes);

module.exports = router;
