const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get all the tour data from collection
  const tours = await Tour.find();

  // 2) Build template overview in pug
  // 3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  // Error handling in case there's no tour
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Build the tour template
  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  // 1) Find all bookings for current user
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  //Looping through the entire bookings array and on each element grab the element.tour
  const tourIDs = bookings.map(el => el.tour);
  // Getting tours corresponding to those IDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours
  });
});
