// Passing our secret key into the function exposed, which will give us a stripe object that we can work with
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour in our DB
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // Payment method types array where specify multiple types
    payment_method_types: ['card'],
    // URL that will get call as soon as a credit card has been successfully charged
    success_url: `${req.protocol}://${req.get('host')}/`,
    // Page where the user goes if they choose to cancel the current payment
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    // As this is a protected route the user is already at the req
    customer_email: req.user.email,
    // Specifying custom field "client_reference_id" which will allow us to pass in some data about the session that we're currently creating
    //bc later if purchase successful we'll get access to the session obj, and we want to create a new booking in the DB
    client_reference_id: req.params.tourId,
    // Details about the product, accepts an array of obj, 1 per item
    line_items: [
      {
        // Field names here comes from stripe
        name: `${tour.name} Tour`,
        description: tour.summary,
        // Array of live images bc stripe upload this image to their own server
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status('200').json({
    status: 'success',
    session
  });
});
