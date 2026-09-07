const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

festivalSchema.index({ status: 1 });
festivalSchema.index({ year: 1 });

module.exports = mongoose.model('Festival', festivalSchema);
