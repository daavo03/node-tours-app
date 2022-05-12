// Multer middleware handles multi-part form data, which is a form encoding that's used to upload files from a form
const multer = require('multer');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Creating multer storage - How we want to store our files
const multerStorage = multer.diskStorage({
  // Destination here is a CB function
  destination: (req, file, cb) => {
    // Defining the destination we need to call the cb and 1st arg is an error if there's one, 2nd arg actual destination
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // Getting the extension
    const ext = file.mimetype.split('/')[1];
    // Giving the files unique names
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

// Creating multer filter
const multerFilter = (req, file, cb) => {
  // Goal to test if the uploaded file is an image, if it's so we pass true in the cb or false in the cb/w an error
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Configuring multer upload with the multer storage and filter
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// Using the multer upload to create middleware function upload.single() and we pass in the name of the field in the form
exports.uploadUserPhoto = upload.single('photo');

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
  console.log(req.file);
  console.log(req.body);

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
