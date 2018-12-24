const mongoose = require('mongoose');

const regulatoryInfoSchema = new mongoose.Schema({
  _id: false,
  registrationPlace: {
    type: String,
    required: true,
    default: null
  },
  insurance_type: {
    type: String,
    required: true,
    default: null
  },
  insurance_year: {
    type: String,
    required: true,
    default: null
  },
  insurance_month: { type: String, default: null }
});

module.exports = mongoose.model('RegulatoryInfo', regulatoryInfoSchema);
