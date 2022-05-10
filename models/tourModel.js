const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: {
      type: String
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // We can use a setter function, this function run each time that a new value is set for this field
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: {
      type: [String]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    // MongoDB uses GeoJSON to specify geospatial data
    startLocation: {
      // We need to create a new object and have at least 2 field names type-coordinates
      type: {
        type: String,
        // We can specify multiple geometries default point, but also there's polygons, lines
        default: 'Point',
        enum: ['Point']
      },
      // Array of coordinates
      coordinates: [Number],
      address: String,
      description: String
    },
    // We will embed all the locations into the tour documents, in order to create new documents then embed them
    //into another document we need to create an array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // Tours and Users remain separated entities in our DB, thus all we save on certain Tour document is the
    //IDs of the users that are the tour guides for that specific tour only referencing
    guides: [
      {
        // We expect a type of each of the elements in the guides array to be a MongoDB ID
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index to not query all the DB improve Read performance, we pass to the index method, an object with the name of the field
// tourSchema.index({ price: 1 });
// Compound Index for fields that are query the most
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// In order to do geospatial queries we need to first attribute an index to the field where the geospatial data
//that we're searching for is stored. For geospatial data the index needs to be a 2D sphere index IF the data
//describes real points on the Earth like sphere || 2D index IF we're using fictional points on a simple 2d plane
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual Populate for the reviews in each Tour
tourSchema.virtual('reviews', {
  // Name of the model to reference
  ref: 'Review',
  // Specify the name of the fields to connect the 2 datasets
  //Two fields, 1) Foreign field: name of the field in the Review model where the ref to the current model is store
  //2) Local field: where the id it's actually stored in this current Tour model
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

/*
// Retrieving the User documents corresponding to the IDs (when creating a Tour)
tourSchema.pre('save', async function(next) {
  // We have "guides" as the input, which is gonna be an array of all the user IDs, so we will loop through them
  //We got an array "guidesPromises" full of Promises
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  // Run all the promises at the same time
  this.guides = await Promise.all(guidesPromises);

  next();
});
*/

// Populate the guides in the Tours documents
tourSchema.pre(/^find/, function(next) {
  // The populate process always happens in a query. This populate replaces the ID with the actual data
  this.populate({
    // Name of the field to replace
    path: 'guides',
    // To not show certain fields
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
