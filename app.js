const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHanlder = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// Specifying the template to use
app.set('view engine', 'pug');
// Defining where the views are located in our fs
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP Headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Preventing same IP making too many requests to our API
//Creating limiter
const limiter = rateLimit({
  // Defining how many request per IP we are going to allow in certain amount of time
  max: 100,
  // We want to allow here is 100 requests/h
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
//Using the limiter which is a middleware function to limit access to our API route "/api"
app.use('/api', limiter);

// Body parser, reading data from body into req.body. Also limiting the data
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
//Clean any user input from malicious html code
app.use(xss());

// Preventing parameter pollution, only uses the last parameter
app.use(
  hpp({
    // Whitelisting some parameters
    whitelist: [
      // Array of properties allowing duplicates in the querystring
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
// Creating route to access the template
app.get('/', (req, res) => {
  // Rendering the template
  res.status(200).render('base');
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHanlder);

module.exports = app;
