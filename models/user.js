const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validator = require('validator');

const stage = require('../config/config')[process.env.NODE_ENV];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `Name field is required`],
    trim: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: 'Please supply an email address',
    validate: [validator.isEmail, 'Invalid Email Address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  photo: String,
  roles: {
    type: String,
    enum: ['admin', 'subscriber', 'editor'],
    default: 'subscriber'
  }
});

userSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified || !user.isNew) {
    next();
  } else {
    const cipher = crypto.createCipher(stage.algorithm, stage.secretKey);
    user.password = cipher.update(user.password, 'utf-8', 'hex') + cipher.final('hex');
    next();
    /*bcrypt.hash(user.password, stage.saltingRounds, function(err, hash) {
      if (err) {
        console.log('Error hashing password for user', user.name);
        next(err);
      } else {
        user.password = hash;
        next();
      }
    });*/
  }
});

module.exports = mongoose.model('User', userSchema, 'users');
