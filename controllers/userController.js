const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Creating function to filter the body
const filterObj = (obj, ...allowedFields) => {
  // Placeholder for the new object filtered
  const newObj = {};
  // Loop through the object and for each element check if it's one of the allowed fields
  Object.keys(obj).forEach(el => {
    // If allowedFields array includes the current field name then we want to add that to a new object
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Middleware for the user retrieving his own ID
exports.getMe = (req, res, next) => {
  // The "req.params.id" is what the "getOne" function is going to use and set it equal to "req.user.id"
  req.params.id = req.user.id;
  next();
};

// Updating Currently auth user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create an error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }

  // 2) Filtering the body so that only contains fields we want to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3)Update user document
  //Since we're not dealing with passwords, we can now user "findByIdAndUpdate"
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Deleting User it's account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Not for updating passwords
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
