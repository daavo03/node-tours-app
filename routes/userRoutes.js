const express = require('express');
// Multer middleware handles multi-part form data, which is a form encoding that's used to upload files from a form
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// Configuring multer upload
const upload = multer({
  // Destination to save all the images uploaded in our fs
  dest: 'public/img/users'
});

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all the routes that comes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
// userController will add the user to the current request which will allow us to read the ID from that user
router.get('/me', userController.getMe, userController.getUser);
// Using the multer upload to create middleware function upload.single() and we pass in the name of the field in the form
router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Only access to route if you're admin after this middleware
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
