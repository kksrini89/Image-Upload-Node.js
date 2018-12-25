const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    stocker: { ref: 'Stocker', type: mongoose.Schema.Types.Mixed },
    regulatoryInfo: { ref: 'RegulatoryInfo', type: mongoose.Schema.Types.Mixed },
    priceWarranty: { ref: 'PriceWarranty', type: mongoose.Schema.Types.Mixed },
    photos: {
      type: [{ ref: 'Image', type: mongoose.Schema.Types.ObjectId }],
      required: true
    },
    duration: String,
    mileage: String,
    description: String,
    isCarAccidental: Boolean,
    isCarCertified: Boolean,
    isCarFloodAffected: Boolean,
    stock_entryDate: Date,
    createdBy: { ref: 'User', type: mongoose.Schema.Types.Mixed },
    updatedBy: { ref: 'User', type: mongoose.Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false }
    // createdDate: Date
  },
  { validateBeforeSave: true, timestamps: true }
);

module.exports = mongoose.model('Car', carSchema, 'cars');
