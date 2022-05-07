const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

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
