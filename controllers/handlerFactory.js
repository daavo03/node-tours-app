const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Function for deleting a document
// We pass the Model and then we create a new function which right away return our async function
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

// Passing the populate options object
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // First creating the query
    let query = Model.findById(req.params.id);
    // Then if there's populate options object add it to the query
    if (popOptions) query = query.populate(popOptions);
    // Finally we await our query and save it in the doc
    const doc = await query;

    // Doing the populate for the review in each Tour
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    // Checking if there's a tourId, if there's one the filter will only search for reviews where the Tour=tourId
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QuERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
