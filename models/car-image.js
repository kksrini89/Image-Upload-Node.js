const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  image_type: {
    type: String,
    enum: ['car_image', 'profile_image', 'dealer_image'],
    default: 'car_image'
  },
  // url: {
  //   type: String,
  //   trim: true,
  //   required: true
  // },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    default: null
    // required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
    // required: true
  }
});

module.exports = mongoose.model('Image', imageSchema, 'car-images');
