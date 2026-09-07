const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Donor = require('./models/Donor');
const Festival = require('./models/Festival');
const Transaction = require('./models/Transaction');
const ReceiptDelivery = require('./models/ReceiptDelivery');
const ReceiptTemplate = require('./models/ReceiptTemplate');
const CommitteeSettings = require('./models/CommitteeSettings');
const ReceiptCounter = require('./models/ReceiptCounter');
const AuditLog = require('./models/AuditLog');

const DEFAULT_URI = 'mongodb+srv://vasakumarbhargav_db_user:99519663%40Kb@cluster0.m6dsgwm.mongodb.net/vinayaka_db?retryWrites=true&w=majority';

async function initMongo(uri) {
  let targetUri = uri;
  if (!targetUri || targetUri.includes('YOUR_CLUSTER')) {
    targetUri = DEFAULT_URI;
  }

  try {
    await mongoose.connect(targetUri);
    console.log('[MongoDB] Connected successfully to MongoDB Atlas!');

    // 1. Seed Active Festival if none exists
    const activeFestival = await Festival.findOne({ status: 'active' });
    if (!activeFestival) {
      await Festival.create({
        name: 'Vinayaka Chavithi 2026',
        year: 2026,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2026-09-15'),
        status: 'active'
      });
      console.log('[MongoDB] Seeded default active festival: Vinayaka Chavithi 2026');
    }

    // 2. Ensure Admin User exists and is active
    let adminUser = await User.findOne({ username: 'admin' });
    const password_hash = bcrypt.hashSync('admin123', 10);

    if (!adminUser) {
      await User.create({
        name: 'Committee Admin',
        username: 'admin',
        password_hash,
        role: 'admin',
        status: 'active',
        mobile: '9876543210'
      });
      console.log('[MongoDB] Seeded default admin user (admin / admin123)');
    } else {
      adminUser.status = 'active';
      adminUser.role = 'admin';
      adminUser.password_hash = password_hash;
      await adminUser.save();
      console.log('[MongoDB] Verified admin user account status: active');
    }

    // 3. Seed Committee Settings if none exist
    const settingsCount = await CommitteeSettings.countDocuments();
    if (settingsCount === 0) {
      await CommitteeSettings.create({
        committee_name: 'Sri Vinayaka Chavithi Utsava Samithi',
        festival_name: 'Ganesh Chaturthi Utsav 2026',
        festival_year: 2026,
        address: 'Main Road, Temple Center',
        village_city: 'Hyderabad',
        contact_number: '+91 9876543210',
        whatsapp_number: '+91 9876543210',
        email: 'contact@vinayakachavithi.org',
        website: 'www.vinayakachavithi.org',
        committee_members: [
          { name: 'Sri R. Sharma', role: 'President' },
          { name: 'Sri K. Varma', role: 'General Secretary' },
          { name: 'Sri M. Rao', role: 'Treasurer' }
        ],
        thank_you_message: 'May Lord Ganesha bless you & your family with health, wealth & happiness!',
        footer_message: 'This is an official computer-generated receipt.',
        receipt_number_config: {
          common_prefix: 'VC-',
          donation_prefix: 'DON-',
          sponsorship_prefix: 'SPON-',
          padding_length: 4,
          starting_number: 1
        }
      });
      console.log('[MongoDB] Seeded default Committee Settings');
    }

    // 4. Seed Default Receipt Templates if missing
    const donationTemplate = await ReceiptTemplate.findOne({ receipt_type: 'donation', is_active: true });
    if (!donationTemplate) {
      await ReceiptTemplate.create({
        receipt_type: 'donation',
        template_name: 'Standard Donation Receipt',
        version: 1,
        is_active: true,
        design: {
          page: { width: 800, height: 600, orientation: 'portrait' },
          background: { type: 'color', value: '#FFFDF5' },
          header: { enabled: true, alignment: 'center' },
          footer: { enabled: true, alignment: 'center' },
          logo: { enabled: true, position: 'center', width: 80, height: 80 },
          group_photo: { enabled: true, position: 'center', width: 140, height: 90 },
          typography: { font_family: 'Inter', base_font_size: 14 },
          border: { enabled: true, width: 2, radius: 8 },
          spacing: { top: 16, right: 16, bottom: 16, left: 16 }
        },
        fields: [
          { key: 'receipt_number', label: 'Receipt No.', visible: true, order: 1, font_size: 14, alignment: 'left', bold: true },
          { key: 'transaction_date', label: 'Date', visible: true, order: 2, font_size: 14, alignment: 'right', bold: false },
          { key: 'donor_name', label: 'Devotee Name', visible: true, order: 3, font_size: 16, alignment: 'left', bold: true },
          { key: 'mobile', label: 'Mobile Number', visible: true, order: 4, font_size: 14, alignment: 'left', bold: false },
          { key: 'amount', label: 'Donation Amount', visible: true, order: 5, font_size: 18, alignment: 'left', bold: true },
          { key: 'amount_in_words', label: 'Amount in Words', visible: true, order: 6, font_size: 14, alignment: 'left', bold: false },
          { key: 'payment_mode', label: 'Payment Mode', visible: true, order: 7, font_size: 14, alignment: 'left', bold: false },
          { key: 'payment_transaction_id', label: 'Transaction ID', visible: true, order: 8, font_size: 14, alignment: 'left', bold: false },
          { key: 'collected_by_name', label: 'Collected By', visible: true, order: 9, font_size: 14, alignment: 'left', bold: false }
        ]
      });
      console.log('[MongoDB] Seeded default Donation Receipt Template');
    }

    const sponsorshipTemplate = await ReceiptTemplate.findOne({ receipt_type: 'sponsorship', is_active: true });
    if (!sponsorshipTemplate) {
      await ReceiptTemplate.create({
        receipt_type: 'sponsorship',
        template_name: 'Standard Sponsorship Receipt',
        version: 1,
        is_active: true,
        design: {
          page: { width: 800, height: 600, orientation: 'portrait' },
          background: { type: 'color', value: '#FFFDF5' },
          header: { enabled: true, alignment: 'center' },
          footer: { enabled: true, alignment: 'center' },
          logo: { enabled: true, position: 'center', width: 80, height: 80 },
          group_photo: { enabled: true, position: 'center', width: 140, height: 90 },
          typography: { font_family: 'Inter', base_font_size: 14 },
          border: { enabled: true, width: 2, radius: 8 },
          spacing: { top: 16, right: 16, bottom: 16, left: 16 }
        },
        fields: [
          { key: 'receipt_number', label: 'Receipt No.', visible: true, order: 1, font_size: 14, alignment: 'left', bold: true },
          { key: 'transaction_date', label: 'Date', visible: true, order: 2, font_size: 14, alignment: 'right', bold: false },
          { key: 'donor_name', label: 'Sponsor Name', visible: true, order: 3, font_size: 16, alignment: 'left', bold: true },
          { key: 'mobile', label: 'Mobile Number', visible: true, order: 4, font_size: 14, alignment: 'left', bold: false },
          { key: 'sponsorship_category', label: 'Sponsorship Category', visible: true, order: 5, font_size: 14, alignment: 'left', bold: true },
          { key: 'sponsorship_details', label: 'Sponsorship Details', visible: true, order: 6, font_size: 14, alignment: 'left', bold: false },
          { key: 'amount', label: 'Amount', visible: true, order: 7, font_size: 16, alignment: 'left', bold: true },
          { key: 'payment_mode', label: 'Payment Mode', visible: true, order: 8, font_size: 14, alignment: 'left', bold: false },
          { key: 'payment_transaction_id', label: 'Transaction ID', visible: true, order: 9, font_size: 14, alignment: 'left', bold: false },
          { key: 'collected_by_name', label: 'Collected By', visible: true, order: 10, font_size: 14, alignment: 'left', bold: false }
        ]
      });
      console.log('[MongoDB] Seeded default Sponsorship Receipt Template');
    }
  } catch (err) {
    console.error('[MongoDB Connection Error]:', err.message);
  }
}

module.exports = {
  initMongo,
  User,
  Donor,
  Festival,
  Transaction,
  ReceiptDelivery,
  ReceiptTemplate,
  CommitteeSettings,
  ReceiptCounter,
  AuditLog
};
