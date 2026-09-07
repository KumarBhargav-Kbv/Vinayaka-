import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { History, Search, Eye } from 'lucide-react';

export default function MemberHistory({ onViewReceipt }) {
  const { user, token } = useContext(AuthContext);

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 1. My Summary
      const sRes = await fetch('/api/transactions/my-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setSummary(sData);
      }

      // 2. Transactions
      const res = await fetch('/api/transactions?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const name = t.donor?.name || t.donor_name || '';
    const mobile = t.donor?.mobile || t.donor_mobile || '';
    const rNo = t.receipt_number || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || mobile.includes(q) || rNo.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Daily Summary Cards for Logged-In Member */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fffdf5', border: '1.5px solid #d4af37', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#8b0000' }}>
              ₹{summary.today?.total?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginTop: '2px' }}>
              My Today's Collection ({summary.today?.receipts_count || 0} Receipts)
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#8b0000' }}>
              ₹{summary.today?.donations?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginTop: '2px' }}>
              Today's Donations ({summary.today?.donations_count || 0})
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2e7d32' }}>
              ₹{summary.today?.sponsorships?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 600, marginTop: '2px' }}>
              Today's Sponsorships ({summary.today?.sponsorships_count || 0})
            </div>
          </div>

          <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2e7d32' }}>
              ₹{summary.overall?.total_collection?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 600, marginTop: '2px' }}>
              My Total Lifetime Collection
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ color: '#8b0000', margin: 0, fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History color="#8b0000" /> My Collection History
          </h2>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
          <input 
            type="text" 
            placeholder="Search by Devotee Name, Mobile, or Receipt No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.95rem' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading history...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No collection history found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Receipt No</th>
                  <th style={{ padding: '10px' }}>Devotee Name</th>
                  <th style={{ padding: '10px' }}>Mobile</th>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Payment</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>{t.receipt_number}</td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{t.donor?.name || 'Devotee'}</td>
                    <td style={{ padding: '10px' }}>{t.donor?.mobile}</td>
                    <td style={{ padding: '10px', textTransform: 'capitalize' }}>{t.receipt_type}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{t.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px', textTransform: 'uppercase' }}>{t.payment_mode}</td>
                    <td style={{ padding: '10px', color: '#666', fontSize: '0.85rem' }}>
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        onClick={() => onViewReceipt(t._id)}
                        style={{ background: '#8b0000', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        <Eye size={12} style={{ display: 'inline', marginRight: 2 }} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
