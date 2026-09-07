const mongoose = require('mongoose');

const receiptCounterSchema = new mongoose.Schema(
  {
    festival_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Festival', required: true },
    receipt_type: { type: String, required: true },
    prefix: { type: String, required: true },
    current_number: { type: Number, required: true, default: 0 },
    updated_at: { type: Date, default: Date.now }
  }
);

receiptCounterSchema.index({ festival_id: 1, receipt_type: 1, prefix: 1 }, { unique: true });

module.exports = mongoose.model('ReceiptCounter', receiptCounterSchema);
