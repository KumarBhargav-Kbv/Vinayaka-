const mongoose = require('mongoose');

const committeeMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  { _id: false }
);

const committeeSettingsSchema = new mongoose.Schema(
  {
    committee_name: { type: String, default: 'Sri Vinayaka Chavithi Utsava Samithi' },
    festival_name: { type: String, default: 'Ganesh Chaturthi Utsav 2026' },
    festival_year: { type: Number, default: 2026 },
    address: { type: String, default: 'Main Road, Gandhi Center' },
    village_city: { type: String, default: 'Hyderabad' },
    contact_number: { type: String, default: '+91 9876543210' },
    whatsapp_number: { type: String, default: '+91 9876543210' },
    email: { type: String, default: 'info@vinayakachavithi.org' },
    website: { type: String, default: 'www.vinayakachavithi.org' },
    committee_members: [committeeMemberSchema],
    thank_you_message: {
      type: String,
      default: 'May Lord Ganesha bless you and your family with health, wealth & happiness!'
    },
    footer_message: {
      type: String,
      default: 'This is an official computer-generated receipt.'
    },
    receipt_number_config: {
      donation_prefix: { type: String, default: 'DON-' },
      sponsorship_prefix: { type: String, default: 'SPON-' },
      common_prefix: { type: String, default: 'VC-' },
      padding_length: { type: Number, default: 4 },
      starting_number: { type: Number, default: 1 }
    },
    logo: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      width: { type: Number, default: 120 },
      height: { type: Number, default: 120 },
      position: { type: String, default: 'center' },
      enabled: { type: Boolean, default: true }
    },
    group_photo: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      width: { type: Number, default: 220 },
      height: { type: Number, default: 140 },
      position: { type: String, default: 'center' },
      enabled: { type: Boolean, default: true }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('CommitteeSettings', committeeSettingsSchema);
