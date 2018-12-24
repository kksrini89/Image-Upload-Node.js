const mongoose = require('mongoose');

const priceWarrantySchema = new mongoose.Schema({
  _id: false,
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  isFixed: {
    type: Boolean,
    required: true,
    default: true
  },
  isExchangeAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  warranty: {
    type: String,
    required: true,
    default: null
  }
});

module.exports = mongoose.model('PriceWarranty', priceWarrantySchema);
