const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    festival_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Festival', required: true, index: true },
    donor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
    receipt_type: {
      type: String,
      enum: ['donation', 'sponsorship'],
      required: true,
      index: true
    },
    amount: { type: Number, required: true, default: 0 },
    amount_in_words: { type: String },
    sponsorship_category: { type: String, trim: true },
    sponsorship_details: { type: String, trim: true },
    payment_mode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'other'],
      default: 'cash',
      index: true
    },
    payment_transaction_id: { type: String, trim: true },
    receipt_number: { type: String, required: true, unique: true, index: true },
    collection_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collected_by_name: { type: String, required: true },
    transaction_date: { type: Date, default: Date.now, index: true },
    receipt_template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ReceiptTemplate' },
    receipt_template_version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
      index: true
    },
    cancellation_reason: { type: String },
    cancelled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelled_at: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

transactionSchema.index({ festival_id: 1, collection_member_id: 1 });
transactionSchema.index({ festival_id: 1, receipt_type: 1 });
transactionSchema.index({ transaction_date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
