const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    normalized_mobile: { type: String, required: true, index: true, trim: true },
    whatsapp_number: { type: String, trim: true },
    total_donation_amount: { type: Number, default: 0 },
    total_sponsorship_amount: { type: Number, default: 0 },
    total_collection_amount: { type: Number, default: 0 },
    donation_count: { type: Number, default: 0 },
    sponsorship_count: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

donorSchema.index({ normalized_mobile: 1 });
donorSchema.index({ name: 'text' });

module.exports = mongoose.model('Donor', donorSchema);
