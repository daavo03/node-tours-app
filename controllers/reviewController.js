const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// Creating middleware to pass the IDs
exports.setTourUserIds = (req, res, next) => {
  // If we didn't specify the tour ID in the body then we want to take it from the url
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // Same logic as above with the user, we get the "req.user" from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
