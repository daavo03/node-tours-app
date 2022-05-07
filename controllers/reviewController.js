const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  // Checking if there's a tourId, if there's one the filter will only search for reviews where the Tour=tourId
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // The object is what we'll pass and only the reviews where the tour matches the ID are gonna be find
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

// Creating middleware to pass the IDs
exports.setTourUserIds = (req, res, next) => {
  // If we didn't specify the tour ID in the body then we want to take it from the url
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // Same logic as above with the user, we get the "req.user" from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
