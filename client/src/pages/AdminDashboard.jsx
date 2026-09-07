import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, Eye, Ban } from 'lucide-react';

export default function AdminDashboard({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelTxId, setCancelTxId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Dashboard summary
      const sumRes = await fetch('/api/reports/dashboard-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      // 2. Recent transactions
      const txRes = await fetch('/api/transactions?limit=15', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setRecentTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason || !cancelTxId) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/transactions/${cancelTxId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (res.ok) {
        setCancelTxId(null);
        setCancelReason('');
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel transaction');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#8b0000', fontWeight: '700' }}>Loading Dashboard Metrics...</div>;
  }

  const pb = summary?.payment_breakdown || {};

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fffdf5', border: '2px solid #d4af37', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b0000' }}>
            ₹{summary?.total_collection?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, marginTop: '4px' }}>Total Collection</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>
            {summary?.total_donors || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, marginTop: '4px' }}>Unique Donors</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8b0000' }}>
            ₹{summary?.total_donations?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, marginTop: '4px' }}>Total Donations ({summary?.donation_count || 0})</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>
            ₹{summary?.total_sponsorships?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600, marginTop: '4px' }}>Total Sponsorships ({summary?.sponsorship_count || 0})</div>
        </div>

        <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2e7d32' }}>
            ₹{summary?.today?.amount?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600, marginTop: '4px' }}>Today's Collection ({summary?.today?.count || 0} Receipts)</div>
        </div>
      </div>

      {/* Payment Reconciliation Breakdown */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#8b0000', margin: '0 0 16px 0', fontSize: '1.1rem' }}>💳 Payment Mode Reconciliation Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>💵 Cash Total</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>₹{pb.cash?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#1565c0' }}>📱 UPI Total</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1565c0' }}>₹{pb.upi?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#e65100' }}>🏦 Bank Transfer</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#e65100' }}>₹{pb.bank_transfer?.toLocaleString('en-IN') || 0}</div>
          </div>
          <div style={{ background: '#f3e5f5', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#7b1fa2' }}>🔁 Other</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#7b1fa2' }}>₹{pb.other?.toLocaleString('en-IN') || 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#8b0000', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard color="#8b0000" size={20} /> Recent Collections
        </h3>

        {recentTransactions.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '24px' }}>No recent collections recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Receipt No</th>
                  <th style={{ padding: '10px' }}>Donor Name</th>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Amount / Details</th>
                  <th style={{ padding: '10px' }}>Payment</th>
                  <th style={{ padding: '10px' }}>Collected By</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>WhatsApp</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #eee', opacity: t.status === 'cancelled' ? 0.5 : 1 }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>{t.receipt_number}</td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{t.donor?.name || 'Devotee'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        background: t.receipt_type === 'donation' ? '#e8f5e9' : '#fff3e0',
                        color: t.receipt_type === 'donation' ? '#2e7d32' : '#e65100',
                        padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase'
                      }}>
                        {t.receipt_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      ₹{t.amount?.toLocaleString('en-IN')}
                      {t.sponsorship_category && <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>{t.sponsorship_category}</div>}
                    </td>
                    <td style={{ padding: '10px', textTransform: 'uppercase' }}>{t.payment_mode}</td>
                    <td style={{ padding: '10px' }}>{t.collected_by_name}</td>
                    <td style={{ padding: '10px' }}>
                      {t.status === 'cancelled' ? (
                        <span style={{ background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cancelled</span>
                      ) : (
                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        background: t.whatsapp_status === 'sent' || t.whatsapp_status === 'delivered' ? '#e8f5e9' : '#fff8e1',
                        color: t.whatsapp_status === 'sent' || t.whatsapp_status === 'delivered' ? '#2e7d32' : '#f57f17',
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'
                      }}>
                        {t.whatsapp_status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => onViewReceipt(t._id)}
                        style={{ background: '#8b0000', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        <Eye size={12} style={{ display: 'inline', marginRight: 2 }} /> Receipt
                      </button>
                      {t.status === 'active' && (
                        <button
                          onClick={() => setCancelTxId(t._id)}
                          style={{ background: '#c62828', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Cancel Transaction"
                        >
                          <Ban size={12} style={{ display: 'inline', marginRight: 2 }} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Cancellation Modal */}
      {cancelTxId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ color: '#c62828', marginTop: 0 }}>Cancel Financial Transaction</h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              Financial transactions are soft-deleted for compliance. Specify reason for audit logging.
            </p>
            <form onSubmit={handleCancelSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Cancellation Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Duplicate entry / Incorrect amount entered by member"
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCancelTxId(null)}
                  style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  style={{ padding: '8px 16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
