const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  // url: {
  //   type: String,
  //   trim: true,
  //   required: true
  // },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Image', imageSchema, 'car-images');
