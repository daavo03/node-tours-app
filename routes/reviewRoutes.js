const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('../controllers/authController');

// We need the mergeParams because each router only has access to the parameters of their specific route.
//But for the POST of the review there's no tourId. In order to get access to the other parameter in the other
//router we need to merge the parameters
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.protect, authController.restrictTo('user'), reviewController.createReview);

module.exports = router;
