const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('../controllers/authController');

// We need the mergeParams because each router only has access to the parameters of their specific route.
//But for the POST of the review there's no tourId. In order to get access to the other parameter in the other
//router we need to merge the parameters
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
