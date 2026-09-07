const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'collection_member'],
      default: 'collection_member'
    },
    mobile: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active'
    },
    last_login_at: { type: Date }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

userSchema.index({ username: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
