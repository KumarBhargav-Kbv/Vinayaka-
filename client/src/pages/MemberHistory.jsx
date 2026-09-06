import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { History, Search, Eye } from 'lucide-react';

export default function MemberHistory({ onViewReceipt }) {
  const { user, token } = useContext(AuthContext);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) =>
    t.donor_name.toLowerCase().includes(search.toLowerCase()) ||
    t.donor_mobile.includes(search) ||
    t.receipt_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <History color="#e65100" /> My Collection History
          </h2>
          <span style={{ fontSize: '0.9rem', color: '#6b0000', fontWeight: '700', background: '#fff8e7', padding: '4px 12px', borderRadius: '14px', border: '1px solid #ebd7a3' }}>
            Total Donated: ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Search */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
            <input 
              type="text" 
              className="form-control"
              placeholder="Search by Donor Name, Mobile, or Receipt No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading history...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No collections found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Donor Name</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Amount / Details</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '700', color: '#e65100' }}>{t.receipt_number}</td>
                    <td style={{ fontWeight: '600' }}>{t.donor_name}</td>
                    <td>{t.donor_mobile}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <span className={`badge ${t.receipt_type === 'donation' ? 'badge-success' : 'badge-warning'}`}>
                        {t.receipt_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700' }}>
                      {t.receipt_type === 'donation' ? `₹${t.amount?.toLocaleString('en-IN')}` : t.sponsorship_details}
                    </td>
                    <td>{t.payment_mode}</td>
                    <td style={{ color: '#666', fontSize: '0.85rem' }}>{t.transaction_date}</td>
                    <td>
                      <button 
                        onClick={() => onViewReceipt(t.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> Receipt
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
