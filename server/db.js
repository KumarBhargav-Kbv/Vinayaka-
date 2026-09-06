const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

let rawDb = null;

// Helper to save DB buffer to disk file
function saveToDisk() {
  if (rawDb) {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Synchronously load or initialize sql.js
let fileBuffer = null;
if (fs.existsSync(dbPath)) {
  fileBuffer = fs.readFileSync(dbPath);
}

// Class to mirror better-sqlite3 prepared statement API
class Statement {
  constructor(sql, rawDbInstance) {
    this.sql = sql;
    this.rawDbInstance = rawDbInstance;
  }

  get(...args) {
    // Handle parameter arrays or positional arguments
    let params = args;
    if (args.length === 1 && Array.isArray(args[0])) {
      params = args[0];
    }
    const stmt = this.rawDbInstance.prepare(this.sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    let result = undefined;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  all(...args) {
    let params = args;
    if (args.length === 1 && Array.isArray(args[0])) {
      params = args[0];
    }
    const stmt = this.rawDbInstance.prepare(this.sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  run(...args) {
    let params = args;
    if (args.length === 1 && Array.isArray(args[0])) {
      params = args[0];
    }
    const stmt = this.rawDbInstance.prepare(this.sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    stmt.step();
    stmt.free();

    // Get last insert row id
    const rowIdStmt = this.rawDbInstance.prepare('SELECT last_insert_rowid() AS id');
    let lastInsertRowid = 0;
    if (rowIdStmt.step()) {
      lastInsertRowid = rowIdStmt.getAsObject().id;
    }
    rowIdStmt.free();

    // Save changes to disk
    saveToDisk();

    return { lastInsertRowid, changes: 1 };
  }
}

class DBWrapper {
  constructor() {
    this.ready = false;
  }

  init(SQL) {
    if (fileBuffer) {
      rawDb = new SQL.Database(fileBuffer);
    } else {
      rawDb = new SQL.Database();
    }
    this.ready = true;
    this.runMigrations();
  }

  prepare(sql) {
    return new Statement(sql, rawDb);
  }

  exec(sql) {
    rawDb.exec(sql);
    saveToDisk();
  }

  pragma(str) {
    // Sqlite pragma fallback
  }

  runMigrations() {
    // 1. users table
    this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('ADMIN', 'MEMBER')) NOT NULL DEFAULT 'MEMBER',
        status TEXT CHECK(status IN ('ACTIVE', 'DISABLED')) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. donors table
    this.exec(`
      CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. transactions table
    this.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        receipt_type TEXT CHECK(receipt_type IN ('donation', 'sponsorship')) NOT NULL,
        amount REAL DEFAULT 0,
        sponsorship_details TEXT,
        payment_mode TEXT CHECK(payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Other')) NOT NULL DEFAULT 'Cash',
        transaction_id TEXT,
        receipt_number TEXT UNIQUE NOT NULL,
        collection_member_id INTEGER NOT NULL,
        collected_by TEXT NOT NULL,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES donors(id),
        FOREIGN KEY (collection_member_id) REFERENCES users(id)
      );
    `);

    // 4. committee_settings table
    this.exec(`
      CREATE TABLE IF NOT EXISTS committee_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        committee_name TEXT NOT NULL DEFAULT 'Sri Vinayaka Chavithi Utsava Samithi',
        festival_name TEXT NOT NULL DEFAULT 'Ganesh Chaturthi Utsav 2026',
        festival_year TEXT NOT NULL DEFAULT '2026',
        address TEXT DEFAULT 'Main Bazaar, Temple Street',
        village_city TEXT DEFAULT 'Hyderabad',
        contact_number TEXT DEFAULT '+91 98765 43210',
        whatsapp_number TEXT DEFAULT '+91 98765 43210',
        email TEXT DEFAULT 'contact@vinayakachavithi.org',
        website TEXT DEFAULT 'www.vinayakachavithi.org',
        committee_members TEXT DEFAULT 'K. Rama Rao (President), M. Suresh (Treasurer)',
        logo TEXT DEFAULT '',
        group_photo TEXT DEFAULT '',
        thank_you_message TEXT DEFAULT 'May Lord Ganesha Bless You & Your Family With Health, Wealth & Happiness!',
        footer_message TEXT DEFAULT 'This is an official computer-generated receipt.',
        receipt_prefix TEXT DEFAULT 'VC-'
      );
    `);

    // 5. receipt_templates table
    this.exec(`
      CREATE TABLE IF NOT EXISTS receipt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_type TEXT UNIQUE CHECK(receipt_type IN ('donation', 'sponsorship')) NOT NULL,
        template_data TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. receipt_delivery table
    this.exec(`
      CREATE TABLE IF NOT EXISTS receipt_delivery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        whatsapp_number TEXT NOT NULL,
        status TEXT CHECK(status IN ('Pending', 'Sent', 'Delivered', 'Failed')) NOT NULL DEFAULT 'Pending',
        sent_at DATETIME,
        delivered_at DATETIME,
        failure_reason TEXT,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      );
    `);

    // 7. audit_logs table
    this.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        transaction_id INTEGER,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default committee_settings if empty
    const settingRow = this.prepare('SELECT COUNT(*) AS count FROM committee_settings').get();
    if (!settingRow || settingRow.count === 0) {
      this.prepare(`
        INSERT INTO committee_settings (id, committee_name, festival_name, festival_year, address, village_city, contact_number, whatsapp_number, email, website, committee_members, thank_you_message, footer_message, receipt_prefix)
        VALUES (1, 'Sri Vinayaka Chavithi Utsava Samithi', 'Ganesh Chaturthi Utsav 2026', '2026', 'Main Road, Gandhi Center', 'Hyderabad', '+91 9876543210', '+91 9876543210', 'info@vinayakachavithi.org', 'www.vinayakachavithi.org', 'Sri R. Sharma (President), Sri K. Varma (Secretary)', 'May Lord Ganesha bless you and your family with peace and prosperity!', 'Thank you for your generous contribution.', 'VC-')
      `).run();
    }

    // Seed default Users if empty
    const userRow = this.prepare('SELECT COUNT(*) AS count FROM users').get();
    if (!userRow || userRow.count === 0) {
      const adminHash = bcrypt.hashSync('admin123', 10);

      this.prepare(`
        INSERT INTO users (name, username, password_hash, role, status)
        VALUES ('Committee Admin', 'admin', ?, 'ADMIN', 'ACTIVE')
      `).run(adminHash);
    } else {
      // Remove demo account if present
      this.prepare(`DELETE FROM users WHERE username = 'member'`).run();
    }

    // Seed default receipt_templates if empty
    const templateRow = this.prepare('SELECT COUNT(*) AS count FROM receipt_templates').get();
    if (!templateRow || templateRow.count === 0) {
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

      this.prepare(`
        INSERT INTO receipt_templates (receipt_type, template_data)
        VALUES ('donation', ?)
      `).run(JSON.stringify(defaultDonationTemplate));

      this.prepare(`
        INSERT INTO receipt_templates (receipt_type, template_data)
        VALUES ('sponsorship', ?)
      `).run(JSON.stringify(defaultSponsorshipTemplate));
    }
  }
}

const dbWrapper = new DBWrapper();

// Synchronous initialization wrapper using initSqlJs
initSqlJs().then(SQL => {
  dbWrapper.init(SQL);
  console.log('[DB] SQLite database initialized cleanly via sql.js (WebAssembly).');
});

module.exports = dbWrapper;
