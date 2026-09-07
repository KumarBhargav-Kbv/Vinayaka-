import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserCheck, Search, Eye, History } from 'lucide-react';

export default function AdminDonors({ onViewReceipt }) {
  const { token } = useContext(AuthContext);

  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected donor profile modal
  const [selectedDonorId, setSelectedDonorId] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [search]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/donors?query=${encodeURIComponent(search)}`, {
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
    setSelectedDonorId(donorId);
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
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Donor Profile Modal */}
      {selectedDonorId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div className="card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#8b0000', margin: 0 }}>
                👤 Devotee Profile & Complete History
              </h3>
              <button onClick={() => { setSelectedDonorId(null); setDonorProfile(null); }} style={{ background: '#e0e0e0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            {profileLoading || !donorProfile ? (
              <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading donor profile...</p>
            ) : (
              <div>
                <div style={{ background: '#fff8e7', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ebd7a3' }}>
                  <h3 style={{ color: '#8b0000', margin: '0 0 4px 0' }}>{donorProfile.donor.name}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Mobile: {donorProfile.donor.mobile}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#8b0000' }}>
                        ₹{donorProfile.donor.total_collection_amount?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Collection</div>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#8b0000' }}>
                        ₹{donorProfile.donor.total_donation_amount?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Donations ({donorProfile.donor.donation_count || 0})</div>
                    </div>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ebd7a3' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                        ₹{donorProfile.donor.total_sponsorship_amount?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>Sponsorships ({donorProfile.donor.sponsorship_count || 0})</div>
                    </div>
                  </div>
                </div>

                <h4 style={{ color: '#8b0000', marginBottom: '12px' }}>Transaction Records</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Receipt No</th>
                        <th style={{ padding: '8px' }}>Type</th>
                        <th style={{ padding: '8px' }}>Amount</th>
                        <th style={{ padding: '8px' }}>Collected By</th>
                        <th style={{ padding: '8px' }}>Date</th>
                        <th style={{ padding: '8px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorProfile.transactions.map((t) => (
                        <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#8b0000' }}>{t.receipt_number}</td>
                          <td style={{ padding: '8px', textTransform: 'capitalize' }}>{t.receipt_type}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{t.amount?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '8px' }}>{t.collected_by_name}</td>
                          <td style={{ padding: '8px', color: '#666', fontSize: '0.8rem' }}>
                            {new Date(t.transaction_date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <button 
                              onClick={() => { setSelectedDonorId(null); onViewReceipt(t._id); }}
                              style={{ background: '#8b0000', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              <Eye size={12} style={{ display: 'inline', marginRight: 2 }} /> Receipt
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
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#8b0000', margin: '0 0 16px 0', fontFamily: 'Cinzel, serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck color="#8b0000" /> Donor Profiles & Aggregate History
        </h2>

        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
          <input 
            type="text"
            placeholder="Search donor by Name or Mobile Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.95rem' }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading donors...</p>
        ) : donors.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No donor profiles matching search.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Donor Name</th>
                  <th style={{ padding: '10px' }}>Mobile</th>
                  <th style={{ padding: '10px' }}>Donations Count</th>
                  <th style={{ padding: '10px' }}>Sponsorships Count</th>
                  <th style={{ padding: '10px' }}>Total Donated</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{d.name}</td>
                    <td style={{ padding: '10px' }}>{d.mobile}</td>
                    <td style={{ padding: '10px' }}>{d.donation_count || 0}</td>
                    <td style={{ padding: '10px' }}>{d.sponsorship_count || 0}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>
                      ₹{d.total_collection_amount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        onClick={() => openDonorProfile(d._id)}
                        style={{ background: '#8b0000', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <History size={14} style={{ display: 'inline', marginRight: 4 }} /> Full History
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
