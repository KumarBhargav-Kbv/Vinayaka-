function logAudit(db, userId, transactionId, action, oldValue = null, newValue = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, transaction_id, action, old_value, new_value, created_at)
      VALUES (?, ?, ?, ?, ?, DATETIME('now'))
    `);
    stmt.run(
      userId || null,
      transactionId || null,
      action,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    );
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
}

module.exports = { logAudit };
