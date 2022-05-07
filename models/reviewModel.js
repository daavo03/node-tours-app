const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Populate the tours in the Review documents
//But because we're getting a lot of querys we only need to populate the user, we do not need the tours data on each review
reviewSchema.pre(/^find/, function(next) {
  // The populate process always happens in a query. This populate replaces the ID with the actual data
  //this.populate({
  // Name of the field to replace
  //path: 'tour',
  // To show or not certain fields
  //select: 'name'
  // Populate the users in the Review documents
  //})
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
