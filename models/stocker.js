const mongoose = require('mongoose');

const stockerSchema = new mongoose.Schema({
  _id: false,
  make: { type: String, required: true },
  model: { type: String, required: true },
  varriant: { type: String, required: true },
  make_year: { type: Number, required: true },
  make_month: { type: Number, required: true },
  number_of_owners: { type: Number, required: true },
  kms_driven: { type: Number, required: true },
  transmission_type: { type: String, required: true },
  fuel_type: { type: String, required: true },
  condition: { type: String, required: true },
  color: { type: String, required: true },
  vehicle_type: { type: String, required: true },
  inspection_valid_until: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stocker', stockerSchema);
