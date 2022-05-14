const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    // Defining a default photo for new users
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  // Saving the reset token in the DB so that we can then compare it with Token user provided
  passwordResetToken: String,
  // The reset need to expire after x amount of time
  passwordResetExpires: Date,
  // Property to set if an user delete it's account
  active: {
    type: Boolean,
    default: true,
    // Not showing this in the output
    select: false
  }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12, I use 15
  this.password = await bcrypt.hash(this.password, 14);

  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Updating the "changedPasswordAt" property via middleware
//This function will run before a new document is saved
userSchema.pre('save', async function(next) {
  // We want to set the property when we modified the 'password' property or if the document is new
  if (!this.isModified('password') || this.isNew) return next();

  // Putting the passwordChangedAt 1s in the past to match time diff between JWT-DB
  //ensuring the token always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Using query middleware to not show up data with active field to false
//We use a regular expression bc we want middleware function to apply every query that starts with find
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // False means NOT changed
  return false;
};

// Generating the random password reset token creating an instance method
userSchema.methods.createPasswordResetToken = function() {
  // Generate the Token which will be sent to the User to reset their password
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    // Updating the variable where the Token is stored, whatever string we want to encrypt
    .update(resetToken)
    // Storing it as hexadecimal
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  // Setting up the expiring time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Returning the plain text token bc that's the one we're gonna send through the email
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
