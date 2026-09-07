const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entity_type: { type: String },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    old_value: { type: Object },
    new_value: { type: Object },
    reason: { type: String },
    ip_address: { type: String },
    user_agent: { type: String }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

auditLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
