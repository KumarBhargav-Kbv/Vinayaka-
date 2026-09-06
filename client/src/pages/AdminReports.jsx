import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FileText, Download, Filter, Eye, Users } from 'lucide-react';

export default function AdminReports({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  // Data
  const [members, setMembers] = useState([]);
  const [memberSummary, setMemberSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredTransactions();
  }, [dateFrom, dateTo, receiptType, paymentMode, selectedMember]);

  const fetchInitialData = async () => {
    try {
      // 1. Members list for dropdown
      const mRes = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } });
      const mData = await mRes.json();
      if (mRes.ok) setMembers(mData);

      // 2. Member summary report
      const sRes = await fetch('/api/reports/member-summary', { headers: { Authorization: `Bearer ${token}` } });
      const sData = await sRes.json();
      if (sRes.ok) setMemberSummary(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilteredTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (receiptType) params.append('receipt_type', receiptType);
      if (paymentMode) params.append('payment_mode', paymentMode);
      if (selectedMember) params.append('member_id', selectedMember);

      const res = await fetch(`/api/transactions?${params.toString()}`, {
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

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (receiptType) params.append('receipt_type', receiptType);
    if (paymentMode) params.append('payment_mode', paymentMode);
    if (selectedMember) params.append('member_id', selectedMember);

    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  };

  const totalFilteredAmount = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div>
      {/* SECTION 1: MEMBER-WISE COLLECTION SUMMARY REPORT */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Users color="#e65100" /> Member-Wise Collection Summary
          </h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr style={{ background: '#fff8e7' }}>
                <th>Member Name</th>
                <th>Username</th>
                <th>Donations Count</th>
                <th>Sponsorships Count</th>
                <th>Total Collection (INR)</th>
              </tr>
            </thead>
            <tbody>
              {memberSummary.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '700' }}>{m.member_name}</td>
                  <td>{m.username}</td>
                  <td>{m.donations_count}</td>
                  <td>{m.sponsorships_count}</td>
                  <td style={{ fontWeight: '800', color: '#6b0000' }}>
                    ₹{m.total_collection?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: FILTERABLE REPORTS & CSV EXPORT */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Filter color="#e65100" /> Custom Filtered Report & Export
          </h3>
          <button onClick={handleExportCSV} className="btn btn-success">
            <Download size={18} /> Export Filtered CSV
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', background: '#fff8e7', padding: '1rem', borderRadius: '10px', border: '1px solid #ebd7a3' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Date From</label>
            <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '0.4rem' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Date To</label>
            <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '0.4rem' }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Receipt Type</label>
            <select className="form-control" value={receiptType} onChange={(e) => setReceiptType(e.target.value)} style={{ padding: '0.4rem' }}>
              <option value="">All Types</option>
              <option value="donation">Donations Only</option>
              <option value="sponsorship">Sponsorships Only</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Payment Mode</label>
            <select className="form-control" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={{ padding: '0.4rem' }}>
              <option value="">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Collector</label>
            <select className="form-control" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} style={{ padding: '0.4rem' }}>
              <option value="">All Collectors</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid #ebd7a3', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Showing <strong>{transactions.length}</strong> matching transaction records</span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#6b0000' }}>
            Total Filtered Sum: ₹{totalFilteredAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Filtered Table */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>Loading filtered transactions...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Donor</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Amount / Details</th>
                  <th>Payment</th>
                  <th>Collected By</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '700', color: '#e65100' }}>{t.receipt_number}</td>
                    <td style={{ fontWeight: '600' }}>{t.donor_name}</td>
                    <td>{t.donor_mobile}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.receipt_type}</td>
                    <td style={{ fontWeight: '700' }}>
                      {t.receipt_type === 'donation' ? `₹${t.amount?.toLocaleString('en-IN')}` : t.sponsorship_details}
                    </td>
                    <td>{t.payment_mode}</td>
                    <td>{t.collected_by}</td>
                    <td style={{ color: '#666' }}>{t.transaction_date}</td>
                    <td>
                      <button 
                        onClick={() => onViewReceipt(t.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
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
