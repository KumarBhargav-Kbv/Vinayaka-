const mongoose = require('mongoose');

const receiptFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, required: true },
    font_size: { type: Number, default: 14 },
    alignment: { type: String, default: 'left' },
    bold: { type: Boolean, default: false }
  },
  { _id: false }
);

const receiptTemplateSchema = new mongoose.Schema(
  {
    receipt_type: {
      type: String,
      enum: ['donation', 'sponsorship'],
      required: true,
      index: true
    },
    template_name: { type: String, required: true },
    version: { type: Number, default: 1 },
    is_active: { type: Boolean, default: true },
    design: {
      page: {
        width: { type: Number, default: 800 },
        height: { type: Number, default: 600 },
        orientation: { type: String, default: 'portrait' }
      },
      background: {
        type: { type: String, default: 'color' },
        value: { type: String, default: '#FFFDF5' }
      },
      header: {
        enabled: { type: Boolean, default: true },
        alignment: { type: String, default: 'center' }
      },
      footer: {
        enabled: { type: Boolean, default: true },
        alignment: { type: String, default: 'center' }
      },
      logo: {
        enabled: { type: Boolean, default: true },
        position: { type: String, default: 'center' },
        width: { type: Number, default: 80 },
        height: { type: Number, default: 80 }
      },
      group_photo: {
        enabled: { type: Boolean, default: true },
        position: { type: String, default: 'center' },
        width: { type: Number, default: 140 },
        height: { type: Number, default: 90 }
      },
      typography: {
        font_family: { type: String, default: 'Inter' },
        base_font_size: { type: Number, default: 14 }
      },
      border: {
        enabled: { type: Boolean, default: true },
        width: { type: Number, default: 2 },
        radius: { type: Number, default: 8 }
      },
      spacing: {
        top: { type: Number, default: 16 },
        right: { type: Number, default: 16 },
        bottom: { type: Number, default: 16 },
        left: { type: Number, default: 16 }
      }
    },
    fields: [receiptFieldSchema],
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

receiptTemplateSchema.index({ receipt_type: 1, is_active: 1 });

module.exports = mongoose.model('ReceiptTemplate', receiptTemplateSchema);
