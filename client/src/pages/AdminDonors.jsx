import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserCheck, Search, Eye, History, IndianRupee, Calendar } from 'lucide-react';

export default function AdminDonors({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected donor profile modal
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [search]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/donors?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDonors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDonorProfile = async (donorId) => {
    setSelectedDonor(donorId);
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/donors/${donorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDonorProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      {/* Donor Profile Modal */}
      {selectedDonor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h3 className="card-title">
                👤 Devotee / Donor Profile
              </h3>
              <button onClick={() => { setSelectedDonor(null); setDonorProfile(null); }} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem' }}>
                ✕ Close
              </button>
            </div>

            {profileLoading || !donorProfile ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading donor profile...</p>
            ) : (
              <div>
                <div style={{ background: '#fff8e7', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #ebd7a3' }}>
                  <h3 style={{ color: '#6b0000', margin: 0 }}>{donorProfile.donor.name}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Mobile: {donorProfile.donor.mobile}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6b0000' }}>
                        ₹{donorProfile.summary.total_donations?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>Total Donated</div>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#e65100' }}>
                        {donorProfile.summary.total_sponsorships}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>Sponsorships</div>
                    </div>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2e7d32' }}>
                        {donorProfile.summary.total_transactions}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#777' }}>Receipts</div>
                    </div>
                  </div>
                </div>

                <h4 style={{ color: '#6b0000', marginBottom: '0.5rem' }}>Transaction History</h4>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Type</th>
                        <th>Amount / Details</th>
                        <th>Collected By</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorProfile.transactions.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: '700', color: '#e65100' }}>{t.receipt_number}</td>
                          <td style={{ textTransform: 'capitalize' }}>{t.receipt_type}</td>
                          <td style={{ fontWeight: '600' }}>
                            {t.receipt_type === 'donation' ? `₹${t.amount?.toLocaleString('en-IN')}` : t.sponsorship_details}
                          </td>
                          <td>{t.collected_by}</td>
                          <td>{t.transaction_date}</td>
                          <td>
                            <button 
                              onClick={() => { setSelectedDonor(null); onViewReceipt(t.id); }}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Donor List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <UserCheck color="#e65100" /> Donor History & Profiles
          </h2>
        </div>

        <div className="form-group">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
            <input 
              type="text"
              className="form-control"
              placeholder="Search donor by Name or Mobile Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>Loading donors...</p>
        ) : donors.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>No donor profiles matching search.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Mobile</th>
                  <th>Total Receipts</th>
                  <th>Total Donated</th>
                  <th>Sponsorships</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '700' }}>{d.name}</td>
                    <td>{d.mobile}</td>
                    <td>{d.transaction_count}</td>
                    <td style={{ fontWeight: '700', color: '#6b0000' }}>
                      ₹{d.total_donated?.toLocaleString('en-IN') || 0}
                    </td>
                    <td>{d.total_sponsorships}</td>
                    <td>
                      <button 
                        onClick={() => openDonorProfile(d.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <History size={14} /> Full History
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
