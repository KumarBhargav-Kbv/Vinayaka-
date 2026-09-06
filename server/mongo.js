const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now }
});

const DonorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  donor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  receipt_type: { type: String, enum: ['donation', 'sponsorship'], required: true },
  amount: { type: Number, default: 0 },
  sponsorship_details: { type: String },
  payment_mode: { type: String, default: 'Cash' },
  transaction_id: { type: String },
  receipt_number: { type: String, required: true, unique: true },
  collection_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collected_by: { type: String, required: true },
  transaction_date: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const CommitteeSettingsSchema = new mongoose.Schema({
  committee_name: { type: String, default: 'Sri Vinayaka Chavithi Utsava Samithi' },
  festival_name: { type: String, default: 'Ganesh Chaturthi Utsav 2026' },
  festival_year: { type: String, default: '2026' },
  address: { type: String, default: 'Main Bazaar, Temple Street' },
  village_city: { type: String, default: 'Hyderabad' },
  contact_number: { type: String, default: '+91 98765 43210' },
  whatsapp_number: { type: String, default: '+91 98765 43210' },
  email: { type: String, default: 'contact@vinayakachavithi.org' },
  website: { type: String, default: 'www.vinayakachavithi.org' },
  committee_members: { type: String, default: 'Sri R. Sharma (President), Sri K. Varma (Secretary)' },
  logo: { type: String, default: '' },
  group_photo: { type: String, default: '' },
  thank_you_message: { type: String, default: 'May Lord Ganesha Bless You & Your Family With Health, Wealth & Happiness!' },
  footer_message: { type: String, default: 'This is an official computer-generated receipt.' },
  receipt_prefix: { type: String, default: 'VC-' }
});

const ReceiptTemplateSchema = new mongoose.Schema({
  receipt_type: { type: String, enum: ['donation', 'sponsorship'], required: true, unique: true },
  template_data: { type: Object, required: true },
  is_active: { type: Boolean, default: true },
  updated_at: { type: Date, default: Date.now }
});

const ReceiptDeliverySchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  whatsapp_number: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Sent', 'Delivered', 'Failed'], default: 'Pending' },
  sent_at: { type: Date },
  delivered_at: { type: Date },
  failure_reason: { type: String }
});

const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  action: { type: String, required: true },
  old_value: { type: Object },
  new_value: { type: Object },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Donor = mongoose.model('Donor', DonorSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const CommitteeSettings = mongoose.model('CommitteeSettings', CommitteeSettingsSchema);
const ReceiptTemplate = mongoose.model('ReceiptTemplate', ReceiptTemplateSchema);
const ReceiptDelivery = mongoose.model('ReceiptDelivery', ReceiptDeliverySchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function initMongo(uri) {
  if (!uri) return;
  try {
    await mongoose.connect(uri);
    console.log('[MongoDB Atlas] Connected successfully!');

    // Seed default settings if empty
    const settingsCount = await CommitteeSettings.countDocuments();
    if (settingsCount === 0) {
      await CommitteeSettings.create({
        committee_name: 'Sri Vinayaka Chavithi Utsava Samithi',
        festival_name: 'Ganesh Chaturthi Utsav 2026',
        festival_year: '2026',
        address: 'Main Road, Gandhi Center',
        village_city: 'Hyderabad',
        contact_number: '+91 9876543210',
        whatsapp_number: '+91 9876543210',
        email: 'info@vinayakachavithi.org',
        website: 'www.vinayakachavithi.org',
        committee_members: 'Sri R. Sharma (President), Sri K. Varma (Secretary)',
        thank_you_message: 'May Lord Ganesha bless you and your family with peace and prosperity!',
        footer_message: 'Thank you for your generous contribution.',
        receipt_prefix: 'VC-'
      });
      console.log('[MongoDB Atlas] Seeded default Committee Settings');
    }

    // Seed default Users if empty
    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
      const adminHash = bcrypt.hashSync('admin123', 10);

      await User.create([
        { name: 'Committee Admin', username: 'admin', password_hash: adminHash, role: 'ADMIN', status: 'ACTIVE' }
      ]);
      console.log('[MongoDB Atlas] Seeded default Admin account');
    } else {
      await User.deleteMany({ username: 'member' });
    }

    // Seed default Receipt Templates if empty
    const templateCount = await ReceiptTemplate.countDocuments();
    if (templateCount === 0) {
      const defaultDonationTemplate = {
        title: 'DONATION RECEIPT',
        logo: { show: true, align: 'center', size: 80 },
        groupPhoto: { show: true, align: 'center', size: 140 },
        header: { font: 'Inter', color: '#8B0000', bgColor: '#FFF8DC', align: 'center' },
        fields: [
          { key: 'receipt_number', label: 'Receipt No.', show: true, fontSize: 14 },
          { key: 'transaction_date', label: 'Date', show: true, fontSize: 14 },
          { key: 'donor_name', label: 'Devotee Name', show: true, fontSize: 16 },
          { key: 'mobile', label: 'Mobile Number', show: true, fontSize: 14 },
          { key: 'amount', label: 'Donation Amount', show: true, fontSize: 18 },
          { key: 'amount_words', label: 'Amount in Words', show: true, fontSize: 14 },
          { key: 'payment_mode', label: 'Payment Mode', show: true, fontSize: 14 },
          { key: 'transaction_id', label: 'Transaction ID', show: true, fontSize: 14 },
          { key: 'collected_by', label: 'Collected By', show: true, fontSize: 14 }
        ],
        thankYouMessage: 'May Lord Ganesha Bless You & Your Family!',
        footerMessage: 'This is an official computer-generated receipt.',
        borders: { style: 'solid', color: '#D4AF37', width: 2, radius: 8 },
        spacing: 'normal'
      };

      const defaultSponsorshipTemplate = {
        title: 'SPONSORSHIP RECEIPT',
        logo: { show: true, align: 'center', size: 80 },
        groupPhoto: { show: true, align: 'center', size: 140 },
        header: { font: 'Inter', color: '#8B0000', bgColor: '#FFF8DC', align: 'center' },
        fields: [
          { key: 'receipt_number', label: 'Receipt No.', show: true, fontSize: 14 },
          { key: 'transaction_date', label: 'Date', show: true, fontSize: 14 },
          { key: 'donor_name', label: 'Sponsor Name', show: true, fontSize: 16 },
          { key: 'mobile', label: 'Mobile Number', show: true, fontSize: 14 },
          { key: 'sponsorship_details', label: 'Sponsorship Details', show: true, fontSize: 16 },
          { key: 'payment_mode', label: 'Payment Mode', show: true, fontSize: 14 },
          { key: 'transaction_id', label: 'Transaction ID', show: true, fontSize: 14 },
          { key: 'collected_by', label: 'Collected By', show: true, fontSize: 14 }
        ],
        thankYouMessage: 'Thank you for sponsoring our Utsav grand celebration!',
        footerMessage: 'This is an official computer-generated receipt.',
        borders: { style: 'solid', color: '#D4AF37', width: 2, radius: 8 },
        spacing: 'normal'
      };

      await ReceiptTemplate.create([
        { receipt_type: 'donation', template_data: defaultDonationTemplate },
        { receipt_type: 'sponsorship', template_data: defaultSponsorshipTemplate }
      ]);
      console.log('[MongoDB Atlas] Seeded default Receipt Templates');
    }

  } catch (err) {
    console.error('[MongoDB Atlas Connection Error]:', err.message);
  }
}

module.exports = {
  initMongo,
  User,
  Donor,
  Transaction,
  CommitteeSettings,
  ReceiptTemplate,
  ReceiptDelivery,
  AuditLog
};
