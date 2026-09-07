import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, KeyRound } from 'lucide-react';

export default function AdminMembers() {
  const { token } = useContext(AuthContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password reset modal
  const [resetModalMember, setResetModalMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error(err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, username, password, mobile })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setSuccess(`Collection Member "${data.name}" created successfully!`);
      setName('');
      setUsername('');
      setPassword('');
      setMobile('');
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/members/${member._id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalMember || !newPassword) return;

    try {
      const res = await fetch(`/api/members/${resetModalMember._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      alert(`Password reset successfully for ${resetModalMember.name}`);
      setResetModalMember(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Password Reset Modal */}
      {resetModalMember && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ color: '#8b0000', marginTop: 0 }}>
              <KeyRound size={20} style={{ display: 'inline', marginRight: 4 }} /> Reset Password for {resetModalMember.name}
            </h3>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>New Password</label>
                <input 
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setResetModalMember(null)} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#8b0000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Collection Member Form */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#8b0000', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus color="#8b0000" /> Add New Collection Member
        </h3>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>✓ {success}</div>}

        <form onSubmit={handleAddMember}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Member Full Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Username (Login ID) *</label>
              <input 
                type="text" 
                placeholder="e.g. ramesh"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Initial Password *</label>
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Mobile Number</label>
              <input 
                type="text" 
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <button type="submit" style={{ background: '#8b0000', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Create Collection Member Account
          </button>
        </form>
      </div>

      {/* Existing Members Table */}
      <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ color: '#8b0000', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users color="#8b0000" /> Collection Members & Stats
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>Loading collection members...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#fff8e7', borderBottom: '2px solid #ebd7a3', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Member Name</th>
                  <th style={{ padding: '10px' }}>Username</th>
                  <th style={{ padding: '10px' }}>Mobile</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Donations / Sponsorships</th>
                  <th style={{ padding: '10px' }}>Total Collection</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                      No collection members created yet.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{m.name}</td>
                      <td style={{ padding: '10px' }}>{m.username}</td>
                      <td style={{ padding: '10px' }}>{m.mobile || 'N/A'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          background: m.status === 'active' ? '#e8f5e9' : '#ffebee',
                          color: m.status === 'active' ? '#2e7d32' : '#c62828',
                          padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase'
                        }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {m.donation_count || 0} Donations / {m.sponsorship_count || 0} Sponsorships
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#8b0000' }}>
                        ₹{m.total_amount?.toLocaleString('en-IN') || 0}
                      </td>
                      <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => toggleStatus(m)}
                          style={{
                            background: m.status === 'active' ? '#f57c00' : '#2e7d32',
                            color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                          }}
                        >
                          {m.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => setResetModalMember(m)}
                          style={{ background: '#555', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <KeyRound size={12} style={{ display: 'inline', marginRight: 2 }} /> Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
