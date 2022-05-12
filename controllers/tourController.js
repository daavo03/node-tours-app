const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// Using .fields bc accepts multiple fields at the same time, or .array bc we only have 1 field
exports.uploadTourImages = upload.fields([
  // Each element of the array is an object where we specify the field name and maxCount(we can only have 1 field name imageCover)
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // Multiple files are in req.files
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Processing Cover image
  //Defining the filename putting the name in req.body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Processing images
  req.body.images = [];

  //Using loop to process array images
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      // Pushing the filename into req.body.images
      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// Passing the Model and the populate options object
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
// The new delete controller using the handler factory
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Using destructuring to get all our data at once from the params
  const { distance, latlng, unit } = req.params;
  // Get the coordinates from the latlng variable
  const [lat, lng] = latlng.split(',');
  // Defining the radius
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Test if we got the lat lng var defined
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  // Writing Geospatial query
  //Specifying the filter object. We want to query for 'startLocation' bc it's whats holds the geospatial point where
  //each tour starts and the value we're searching for we'll use a geospatial operator "$geoWithin" - finds docs within
  //a certain geometry
  //We want to find docs inside of a sphere using $centerSphere which takes in an array of the 'lng', 'lat'
  //and has a radius of the 'distance' we defined in radians
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Creating multiplier var
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // Test if we got the lat lng var defined
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
  }

  // Aggregation pipeline for calculations
  const distances = await Tour.aggregate([
    // Stages of the agg pipeline to define
    {
      $geoNear: {
        // It requires that at least 1 of our fields contains a geospatial index
        //Point from which to calculate the distances
        near: {
          // Specifying the point as GeoJSON
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        // Name of the field that will be created and where all the calculated distances will be stored
        distanceField: 'distance',
        // Specifying a number which is then going to be multi with all the distances
        distanceMultiplier: multiplier
      }
    },
    // Project Stage
    {
      $project: {
        // Name of the fields to keep
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
