import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, KeyRound, ShieldAlert, CheckCircle, Edit3, Trash2 } from 'lucide-react';

export default function AdminMembers() {
  const { token } = useContext(AuthContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
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
      if (res.ok) setMembers(data);
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({ name, username, password, role })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setSuccess(`Member "${data.name}" created successfully!`);
      setName('');
      setUsername('');
      setPassword('');
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleStatus = async (member) => {
    const newStatus = member.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
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
      const res = await fetch(`/api/members/${resetModalMember.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
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

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to delete member "${member.name}"?`)) return;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');

      fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Password Reset Modal */}
      {resetModalMember && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
            <h3 style={{ color: '#6b0000', marginBottom: '1rem' }}>
              <KeyRound size={20} /> Reset Password for {resetModalMember.name}
            </h3>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password"
                  className="form-control"
                  placeholder="Enter at least 4 chars"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setResetModalMember(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Collection Member Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <UserPlus color="#e65100" /> Add Collection Member
          </h3>
        </div>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>⚠️ {error}</div>}
        {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>✓ {success}</div>}

        <form onSubmit={handleAddMember}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Member Full Name *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Suresh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. suresh"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input 
                type="password" 
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="MEMBER">Collection Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <UserPlus size={18} /> Create Member Account
          </button>
        </form>
      </div>

      {/* Existing Members Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Users color="#e65100" /> Committee Members List
          </h3>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>Loading members...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Collections</th>
                  <th>Total Raised</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: '700' }}>{m.name}</td>
                    <td>{m.username}</td>
                    <td>
                      <span className="role-tag">{m.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.total_collections || 0}</td>
                    <td style={{ fontWeight: '700', color: '#6b0000' }}>
                      ₹{m.total_donations_amount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          onClick={() => toggleStatus(m)}
                          className={`btn ${m.status === 'ACTIVE' ? 'btn-secondary' : 'btn-success'}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {m.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => setResetModalMember(m)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          <KeyRound size={14} /> Password
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(m)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#d32f2f', color: '#fff', border: 'none' }}
                          title="Delete Member"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
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
