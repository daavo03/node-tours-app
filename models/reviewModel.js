const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

// Storing summary of a related dataset on the main dataset.
// In our app example is to store the average rating and the number of ratings on each tour, so that we don't have to query
//the reviews and calculate averages each time we query for all Tours. Useful overview page front-end we want to show a summary
//of the reviews (number of ratings and average) of a tour each time a new review is added/updated/deleted
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // In order to do calculation, we use aggregation(which is called on a Model) pipeline, in static method "this" points to the current model
  const stats = await this.aggregate([
    // First select all the reviews that belong to the current tour that was passed in as argument
    {
      // First stage is match stage
      $match: { tour: tourId }
    },
    {
      // Calculate statics themselves
      $group: {
        // In the group phase first field we need to specify is the ID,
        //then the common field all the docs have in common that we want to group by which is the tour
        _id: '$tour',
        // The number of ratings we add 1 for each tour that was match in the previous step
        nRating: { $sum: 1 },
        // We want to calculate the average from the "rating" field from the Review Model
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // See if our stats is working
  //console.log(stats);

  // Only execute the code if we have something in the stats array
  if (stats.length > 0) {
    // Persisting the statics in to each Tour document
    //We need to find the current tour and then update it
    await Tour.findByIdAndUpdate(tourId, {
      // Object of the data that we actually want to update
      //The stats are in an array, so we need to go to the 1st position of that array and from there we get the "nRating" prop
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// Calling the stats from a middleware, we use post instead of pre because all the docs are already saved in the DB,
//and it's great time to do the calc with all the reviews already and store that result on the Tour
//In this kind of middleware the "this" keyword points to the document that is currently being saved.
reviewSchema.post('save', function() {
  // this points to the current document and the constructor is basically the model who created that document
  this.constructor.calcAverageRatings(this.tour);
});

// Implementing pre-middleware for deleting-updating stats of a Tour
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // Goal is to get access to the current Review document. So we can execute a query and that will give us the doc that
  // is currently being processed
  // this is current query variable which is use to store the current document as a property in the r
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

// Now we need to use POST because is where the query has already finished and the review updated
reviewSchema.post(/^findOneAnd/, async function() {
  // Now at this point in time where we can call the function to calc the averages
  // Also we get the tourId from passing data from the pre middleware to the post middleware
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
