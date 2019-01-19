const mongoose = require('mongoose');
// const validator = require('validator');

const dealerSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, `Name field is required`],
    trim: true,
    unique: true
  },
  showroomName: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  contact_no: {
    type: String,
    default: null
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
    // default:null
  }
});

module.exports = mongoose.model('Dealer_Info', dealerSchema);
