const mongoose = require('mongoose');

const receiptDeliverySchema = new mongoose.Schema(
  {
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    whatsapp_number: { type: String, required: true },
    provider: { type: String, default: 'WhatsApp Business API' },
    message_id: { type: String },
    receipt_file_url: { type: String },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
      index: true
    },
    sent_at: { type: Date },
    delivered_at: { type: Date },
    failure_reason: { type: String },
    retry_count: { type: Number, default: 0 },
    last_attempt_at: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

receiptDeliverySchema.index({ transaction_id: 1, status: 1 });

module.exports = mongoose.model('ReceiptDelivery', receiptDeliverySchema);
