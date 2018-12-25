const mongoose = require('mongoose');

const regulatoryInfoSchema = new mongoose.Schema({
  _id: false,
  registrationPlace: {
    type: String,
    // required: true,
    default: null
  },
  insurance_type: {
    type: String,
    // required: true,
    default: null
  },
  insurance_year: {
    type: Number,
    // required: true,
    default: Date.now
  },
  insurance_month: {
    type: Number,
    default: Date.now
  }
});

module.exports = mongoose.model('RegulatoryInfo', regulatoryInfoSchema);
