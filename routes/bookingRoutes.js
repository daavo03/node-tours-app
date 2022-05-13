const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// This route doesn't follow REST, this route only for the client to get a checkout session
router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);

module.exports = router;
