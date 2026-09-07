import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Download, Filter, Eye, Users } from 'lucide-react';

export default function AdminReports({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  // Filters
  const [festivals, setFestivals] = useState([]);
  const [selectedFestival, setSelectedFestival] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  // Data
  const [members, setMembers] = useState([]);
  const [memberWiseData, setMemberWiseData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredData();
  }, [selectedFestival, startDate, endDate, receiptType, paymentMode, selectedMember]);

  const fetchInitialData = async () => {
    try {
      // Festivals dropdown
      const fRes = await fetch('/api/festivals', { headers: { Authorization: `Bearer ${token}` } });
      if (fRes.ok) {
        const fData = await fRes.json();
        setFestivals(fData);
        const active = fData.find(f => f.status === 'active');
        if (active) setSelectedFestival(active._id);
      }

      // Members dropdown
      const mRes = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMembers(mData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilteredData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFestival) params.append('festival_id', selectedFestival);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (receiptType) params.append('receipt_type', receiptType);
      if (paymentMode) params.append('payment_mode', paymentMode);
      if (selectedMember) params.append('member_id', selectedMember);

      // 1. Member-wise summary aggregation
      const mwRes = await fetch(`/api/reports/member-wise?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mwRes.ok) {
        const mwData = await mwRes.json();
        setMemberWiseData(mwData);
      }

      // 2. Transactions list
      const txRes = await fetch(`/api/transactions?${params.toString()}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedFestival) params.append('festival_id', selectedFestival);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (receiptType) params.append('receipt_type', receiptType);
    if (paymentMode) params.append('payment_mode', paymentMode);
    if (selectedMember) params.append('member_id', selectedMember);

    window.open(`/api/reports/export-csv?${params.toString()}`, '_blank');
  };

  const totalFilteredAmount = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* SECTION 1: MEMBER-WISE COLLECTION SUMMARY REPORT */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#8b0000', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users color="#8b0000" size={20} /> Member-Wise Collection Performance
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Member Name</th>
                <th style={{ padding: '10px' }}>Donations (INR)</th>
                <th style={{ padding: '10px' }}>Sponsorships (INR)</th>
                <th style={{ padding: '10px' }}>Cash</th>
                <th style={{ padding: '10px' }}>UPI</th>
                <th style={{ padding: '10px' }}>Bank / Other</th>
                <th style={{ padding: '10px' }}>Total Collection</th>
              </tr>
            </thead>
            <tbody>
              {memberWiseData.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{m.collected_by_name || 'Member'}</td>
                  <td style={{ padding: '10px', color: '#8b0000' }}>₹{m.donations_amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', color: '#2e7d32' }}>₹{m.sponsorships_amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px' }}>₹{m.cash_amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px' }}>₹{m.upi_amount?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px' }}>₹{(m.bank_transfer_amount + m.other_amount)?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '1.05rem', color: '#8b0000' }}>
                    ₹{m.total_collection?.toLocaleString('en-IN')} ({m.receipts_count} Receipts)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: FILTERABLE REPORTS & CSV EXPORT */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ color: '#8b0000', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter color="#8b0000" size={20} /> Custom Filtered Report & Export
          </h3>
          <button
            onClick={handleExportCSV}
            style={{
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={18} /> Export Filtered CSV
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px', background: '#fff8e7', padding: '16px', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Festival Year</label>
            <select value={selectedFestival} onChange={(e) => setSelectedFestival(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">All Festivals</option>
              {festivals.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Date From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Date To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Receipt Type</label>
            <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">All Types</option>
              <option value="donation">Donations Only</option>
              <option value="sponsorship">Sponsorships Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Payment Mode</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Collector Member</label>
            <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="">All Members</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px', background: '#fff', border: '1px solid #ebd7a3', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Showing <strong>{transactions.length}</strong> matching transaction records</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#8b0000' }}>
            Filtered Total: ₹{totalFilteredAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Filtered Table */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading filtered transactions...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Receipt No</th>
                  <th style={{ padding: '10px' }}>Donor</th>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Amount / Details</th>
                  <th style={{ padding: '10px' }}>Payment</th>
                  <th style={{ padding: '10px' }}>Collected By</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>{t.receipt_number}</td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{t.donor?.name || 'Devotee'}</td>
                    <td style={{ padding: '10px', textTransform: 'capitalize' }}>{t.receipt_type}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      ₹{t.amount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px', textTransform: 'uppercase' }}>{t.payment_mode}</td>
                    <td style={{ padding: '10px' }}>{t.collected_by_name}</td>
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
